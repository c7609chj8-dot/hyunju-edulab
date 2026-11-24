-- Run as postgres in the target project's SQL editor or execute_sql tool.
-- Fixtures never leave this transaction; this does not test Auth HTTP or mail.
begin;

do $$
declare
  base_metadata jsonb := '{"membership_app":"hyunju-edulab","full_name":"테이블 검증 회원","membership_policy_version":"2026-11-23.2","privacy_consent":true,"overseas_consent":true,"age_14_or_older":true}';
  invalid_case jsonb;
  rejected boolean;
begin
  if exists(select 1 from auth.users where id::text like '41000000-0000-4000-8000-%') then
    raise exception 'Fixture ID collision: no existing account will be modified';
  end if;
  if exists(select 1 from pg_class where oid in (
    'public.member_profiles'::regclass,
    'public.member_administrators'::regclass,
    'public.member_account_audit_logs'::regclass
  ) and not relrowsecurity) then raise exception 'Membership RLS disabled'; end if;
  if has_table_privilege('anon','public.member_profiles','SELECT')
    or has_table_privilege('authenticated','public.member_profiles','INSERT')
    or has_table_privilege('authenticated','public.member_profiles','DELETE')
    or has_table_privilege('authenticated','public.member_administrators','INSERT')
    or has_column_privilege('authenticated','public.member_profiles','email','UPDATE')
    or has_column_privilege('authenticated','public.member_profiles','user_id','UPDATE')
    or has_function_privilege('anon','membership_private.is_active_administrator()','EXECUTE')
    or has_function_privilege('authenticated','membership_private.sync_auth_member()','EXECUTE')
  then raise exception 'Unexpected membership privilege'; end if;

  insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values
    ('41000000-0000-4000-8000-000000000001','day1-member@example.invalid',base_metadata || '{"full_name":"  선택항목 회원  ","username":" DAY1_MEMBER ","address":"  검증용 주소  ","phone":" 01012345678 ","role":"administrator"}',now()),
    ('41000000-0000-4000-8000-000000000002','day1-admin@example.invalid',base_metadata,now()),
    ('41000000-0000-4000-8000-000000000003','day1-optional@example.invalid',base_metadata || '{"username":" ","address":" ","phone":" "}',now()),
    ('41000000-0000-4000-8000-000000000004','day1-other-app@example.invalid','{"full_name":"다른 앱의 회원"}',now());

  if not exists(select 1 from public.member_profiles
    where user_id='41000000-0000-4000-8000-000000000001'
      and full_name='선택항목 회원' and username='day1_member'
      and address='검증용 주소' and phone='01012345678'
      and email='day1-member@example.invalid' and email_confirmed_at is not null
      and account_status='active' and revision=1
      and policy_version='2026-11-23.2'
      and privacy_consented_at is not null and overseas_consented_at is not null)
  then raise exception 'Signup fields, defaults or consent not persisted'; end if;
  if (select count(*) from public.member_profiles
    where user_id in('41000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000003')
      and username is null and address is null and phone is null)<>2
  then raise exception 'Optional fields did not remain optional'; end if;
  if exists(select 1 from public.member_profiles where user_id='41000000-0000-4000-8000-000000000004')
  then raise exception 'Another application account was enrolled'; end if;
  if exists(select 1 from public.member_administrators where user_id='41000000-0000-4000-8000-000000000001')
  then raise exception 'User metadata granted administrator access'; end if;

  -- Each invalid Auth insertion must also roll back its generated profile.
  for invalid_case in select value from jsonb_array_elements('[
    {"full_name":" "},
    {"username":"abc"},
    {"username":"day1_member"},
    {"phone":"123"},
    {"phone":"010-1234-5678"},
    {"privacy_consent":false},
    {"overseas_consent":false},
    {"age_14_or_older":false},
    {"membership_policy_version":"outdated"}
  ]'::jsonb || jsonb_build_array(
    jsonb_build_object('full_name',repeat('가',81)),
    jsonb_build_object('address',repeat('가',301)))) loop
    rejected:=false;
    begin
      insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at)
      values('41000000-0000-4000-8000-000000000009','day1-invalid@example.invalid',base_metadata || invalid_case,now());
    exception when check_violation or unique_violation or raise_exception then
      rejected:=true;
    end;
    if not rejected then raise exception 'Invalid signup accepted: %',invalid_case; end if;
    if exists(select 1 from auth.users where id='41000000-0000-4000-8000-000000000009')
      or exists(select 1 from public.member_profiles where user_id='41000000-0000-4000-8000-000000000009')
    then raise exception 'Failed signup left partial data'; end if;
  end loop;
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"41000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$
declare changed integer; rejected boolean:=false;
begin
  if (select count(*) from public.member_profiles)<>1
    or not exists(select 1 from public.member_profiles where user_id=auth.uid())
  then raise exception 'Member read isolation failed'; end if;
  update public.member_profiles set phone='01099999999' where user_id=auth.uid();
  get diagnostics changed=row_count;
  if changed<>0 then raise exception 'Member edited admin-managed fields'; end if;
  begin
    insert into public.member_administrators(user_id) values(auth.uid());
  exception when insufficient_privilege then rejected:=true;
  end;
  if not rejected then raise exception 'Member elevated own role'; end if;
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

-- Cascading deletion is tested only for a fixture created in this transaction.
delete from auth.users where id='41000000-0000-4000-8000-000000000003';
do $$ begin
  if exists(select 1 from public.member_profiles where user_id='41000000-0000-4000-8000-000000000003')
  then raise exception 'Auth foreign key cascade failed'; end if;
end $$;

rollback;
select 'PASS: signup fields, optional values, uniqueness, validation, consent, atomicity, isolation, privilege boundaries, cross-app isolation and FK cascade; all fixtures rolled back' as result;
