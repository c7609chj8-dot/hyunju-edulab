-- Live schema and access checks. No member records are inserted or modified.
-- Run as postgres. JWT claims are simulated inside this transaction only.
begin read only;

do $$
declare
  administrator uuid;
  required_column text;
begin
  foreach required_column in array array[
    'user_id','full_name','email','email_confirmed_at','username','address','phone',
    'account_status','revision','policy_version','privacy_consented_at',
    'overseas_consented_at','created_at'
  ] loop
    if not exists(select 1 from information_schema.columns
      where table_schema='public' and table_name='member_profiles' and column_name=required_column)
    then raise exception 'Missing profile column: %',required_column; end if;
  end loop;
  if (select count(*) from information_schema.columns
    where table_schema='public' and table_name='member_profiles'
      and column_name in('username','address','phone') and is_nullable='YES')<>3
  then raise exception 'Optional fields are required by the database'; end if;
  if (select count(*) from pg_class where oid in(
    'public.member_profiles'::regclass,'public.member_administrators'::regclass,
    'public.member_account_audit_logs'::regclass) and relrowsecurity)<>3
  then raise exception 'Missing membership RLS'; end if;
  if not exists(select 1 from pg_constraint
    where conrelid='public.member_profiles'::regclass and contype='f'
      and confrelid='auth.users'::regclass and confdeltype='c' and convalidated)
  then raise exception 'Auth foreign key cascade missing'; end if;
  if not exists(select 1 from pg_index
    where indexrelid='public.member_profiles_username_unique'::regclass
      and indisunique and indisvalid)
  then raise exception 'Username unique index missing'; end if;
  if (select count(*) from pg_constraint
    where conrelid='public.member_profiles'::regclass and convalidated
      and conname in('member_profiles_full_name_check','member_profiles_username_check',
        'member_profiles_address_check','member_profiles_phone_check',
        'member_profiles_account_status_check','member_profiles_revision_check'))<>6
  then raise exception 'Missing validated field constraints'; end if;
  if has_table_privilege('anon','public.member_profiles','SELECT')
    or has_table_privilege('anon','public.member_administrators','SELECT')
    or has_table_privilege('anon','public.member_account_audit_logs','SELECT')
    or has_table_privilege('authenticated','public.member_profiles','INSERT')
    or has_table_privilege('authenticated','public.member_profiles','DELETE')
    or has_table_privilege('authenticated','public.member_administrators','INSERT')
    or has_table_privilege('authenticated','public.member_administrators','UPDATE')
    or has_table_privilege('authenticated','public.member_administrators','DELETE')
    or has_table_privilege('authenticated','public.member_account_audit_logs','INSERT')
    or has_table_privilege('authenticated','public.member_account_audit_logs','UPDATE')
    or has_table_privilege('authenticated','public.member_account_audit_logs','DELETE')
    or has_column_privilege('authenticated','public.member_profiles','email','UPDATE')
    or has_column_privilege('authenticated','public.member_profiles','user_id','UPDATE')
    or has_column_privilege('authenticated','public.member_profiles','revision','UPDATE')
    or has_function_privilege('anon','membership_private.is_active_administrator()','EXECUTE')
    or has_function_privilege('authenticated','membership_private.sync_auth_member()','EXECUTE')
  then raise exception 'Unexpected membership privilege'; end if;
  if not has_table_privilege('authenticated','public.member_profiles','SELECT')
    or not has_column_privilege('authenticated','public.member_profiles','phone','UPDATE')
  then raise exception 'Expected member/admin column grants missing'; end if;

  select a.user_id into administrator from public.member_administrators a
    join public.member_profiles p on p.user_id=a.user_id
    join auth.users u on u.id=a.user_id
    where a.is_active and p.account_status='active' and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until<now()) limit 1;
  if administrator is null then raise exception 'No active verified administrator to test'; end if;
  perform set_config('membership_day1.expected_profile_count',(select count(*)::text from public.member_profiles),true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',administrator,'role','authenticated')::text,true);
  if exists(select 1 from auth.users where id='51000000-0000-4000-8000-000000000001')
  then raise exception 'Nonmember test ID collision'; end if;
end $$;

set local role authenticated;
do $$ begin
  if not membership_private.is_active_administrator()
    or (select count(*) from public.member_profiles)<>current_setting('membership_day1.expected_profile_count')::bigint
  then raise exception 'Administrator profile access failed'; end if;
  perform 1 from public.member_account_audit_logs limit 1;
end $$;

-- An authenticated caller without membership must see no member data.
select set_config('request.jwt.claims','{"sub":"51000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
  if membership_private.is_active_administrator()
    or exists(select 1 from public.member_profiles)
    or exists(select 1 from public.member_administrators)
    or exists(select 1 from public.member_account_audit_logs)
  then raise exception 'Nonmember data isolation failed'; end if;
end $$;
reset role;

set local role anon;
do $$
declare rejected boolean:=false;
begin
  begin perform 1 from public.member_profiles;
  exception when insufficient_privilege then rejected:=true;
  end;
  if not rejected then raise exception 'Anonymous profile access allowed'; end if;
end $$;
reset role;
rollback;
select 'PASS: columns, optional fields, constraints, unique index, FK, RLS, privileges, administrator reads, nonmember isolation and anonymous denial; no member data changed' as result;
