create schema if not exists membership_private;
revoke all on schema membership_private from public, anon, authenticated;
grant usage on schema membership_private to authenticated;

alter table public.member_profiles
 add column username text check(username ~ '^[a-z][a-z0-9_]{3,19}$'),
 add column address text check(char_length(address) between 1 and 300),
 add column phone text check(phone ~ '^0[0-9]{8,10}$'),
 add column account_status text not null default 'active' check(account_status in ('active','suspended')),
 add column revision integer not null default 1 check(revision>0);
alter table public.member_profiles
 alter column policy_version drop not null,
 alter column privacy_consented_at drop not null,
 alter column privacy_consented_at drop default,
 alter column overseas_consented_at drop not null,
 alter column overseas_consented_at drop default;
drop policy if exists member_profile_read_by_administrator on public.member_profiles;
drop policy if exists member_profile_read_own on public.member_profiles;
create unique index member_profiles_username_unique on public.member_profiles(username) where username is not null;
create table public.member_account_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  target_user_id uuid not null,
  changed_fields text[] not null,
  previous_status text not null,
  next_status text not null,
  created_at timestamptz not null default now()
);
create index member_account_audit_target_idx on public.member_account_audit_logs(target_user_id,created_at desc);
alter table public.member_profiles enable row level security;
alter table public.member_administrators enable row level security;
alter table public.member_account_audit_logs enable row level security;
revoke all on public.member_profiles, public.member_administrators, public.member_account_audit_logs from public,anon,authenticated;
grant select on public.member_profiles,public.member_administrators,public.member_account_audit_logs to authenticated;
grant update(full_name,username,address,phone,account_status) on public.member_profiles to authenticated;

-- Private helper avoids recursive RLS. It checks the current actor, current
-- database role, membership status and the live Auth record, never user metadata.
create or replace function membership_private.is_active_administrator()
returns boolean language sql stable security definer set search_path=''
as $$
  select (select auth.uid()) is not null and exists(
    select 1 from public.member_administrators a
    join public.member_profiles p on p.user_id=a.user_id
    join auth.users u on u.id=a.user_id
    where a.user_id=(select auth.uid()) and a.is_active
    and p.account_status='active' and u.email_confirmed_at is not null
    and (u.banned_until is null or u.banned_until < now())
  );
$$;
revoke all on function membership_private.is_active_administrator() from public,anon,authenticated;
grant execute on function membership_private.is_active_administrator() to authenticated;
create policy member_profile_read_own on public.member_profiles for select to authenticated using((select auth.uid())=user_id);
create policy member_profile_admin_read on public.member_profiles for select to authenticated using((select membership_private.is_active_administrator()));
create policy member_profile_admin_update on public.member_profiles for update to authenticated
using((select membership_private.is_active_administrator()))
with check((select membership_private.is_active_administrator()));
create policy administrator_role_read on public.member_administrators for select to authenticated
using(user_id=(select auth.uid()) or (select membership_private.is_active_administrator()));
create policy member_audit_admin_read on public.member_account_audit_logs for select to authenticated
using((select membership_private.is_active_administrator()));

create or replace function membership_private.guard_member_update()
returns trigger language plpgsql security definer set search_path=''
as $$
declare actor uuid := auth.uid();
begin
  if row(new.full_name,new.username,new.address,new.phone,new.account_status)
     is distinct from row(old.full_name,old.username,old.address,old.phone,old.account_status) then
    if actor is not null and not membership_private.is_active_administrator() then
      raise exception 'Administrator required' using errcode='42501';
    end if;
    if new.account_status='suspended' and old.account_status is distinct from new.account_status
       and exists(select 1 from public.member_administrators where user_id=new.user_id and is_active) then
      raise exception 'Administrator suspension is blocked' using errcode='P0001';
    end if;
  end if;
  new.revision := old.revision + 1;
  return new;
end;
$$;
create or replace function membership_private.audit_member_update()
returns trigger language plpgsql security definer set search_path=''
as $$
declare fields text[] := array[]::text[];
begin
  if new.full_name is distinct from old.full_name then fields:=array_append(fields,'full_name'); end if;
  if new.username is distinct from old.username then fields:=array_append(fields,'username'); end if;
  if new.address is distinct from old.address then fields:=array_append(fields,'address'); end if;
  if new.phone is distinct from old.phone then fields:=array_append(fields,'phone'); end if;
  if new.account_status is distinct from old.account_status then fields:=array_append(fields,'account_status'); end if;
  if cardinality(fields)>0 then
    insert into public.member_account_audit_logs(actor_user_id,target_user_id,changed_fields,previous_status,next_status)
    values(auth.uid(),new.user_id,fields,old.account_status,new.account_status);
  end if;
  return new;
end;
$$;
revoke all on function membership_private.guard_member_update(),membership_private.audit_member_update() from public,anon,authenticated;
create trigger guard_membership_update before update on public.member_profiles
for each row execute function membership_private.guard_member_update();
create trigger audit_membership_update after update on public.member_profiles
for each row execute function membership_private.audit_member_update();

-- Only app-tagged new registrations enroll in this app. Other existing Auth
-- applications and accounts in the selected project are not modified.
create or replace function membership_private.sync_auth_member()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if tg_table_schema<>'auth' or tg_table_name<>'users' then raise exception 'Invalid trigger source'; end if;
  if not exists(select 1 from public.member_profiles where user_id=new.id)
     and coalesce(new.raw_user_meta_data->>'membership_app','') <> 'hyunju-edulab' then return new; end if;
  if tg_op='INSERT' then
    if new.raw_user_meta_data->>'membership_policy_version' is distinct from '2026-11-23.2'
       or new.raw_user_meta_data->>'privacy_consent' is distinct from 'true'
       or new.raw_user_meta_data->>'overseas_consent' is distinct from 'true'
       or new.raw_user_meta_data->>'age_14_or_older' is distinct from 'true'
    then raise exception 'Membership consent required'; end if;
    insert into public.member_profiles(user_id,full_name,email,email_confirmed_at,policy_version,privacy_consented_at,overseas_consented_at,created_at)
    values(new.id,btrim(new.raw_user_meta_data->>'full_name'),lower(new.email),new.email_confirmed_at,'2026-11-23.2',now(),now(),coalesce(new.created_at,now()));
  else
    update public.member_profiles set email=lower(new.email),email_confirmed_at=new.email_confirmed_at where user_id=new.id;
    if new.email is distinct from old.email or new.email_confirmed_at is null then
      update public.member_administrators set is_active=false where user_id=new.id;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function membership_private.sync_auth_member() from public,anon,authenticated;
drop trigger if exists sync_membership_after_auth_insert on auth.users;
create trigger sync_membership_after_auth_insert after insert on auth.users
for each row execute function membership_private.sync_auth_member();
drop trigger if exists sync_membership_after_auth_update on auth.users;
create trigger sync_membership_after_auth_update after update of email,email_confirmed_at,raw_user_meta_data on auth.users
for each row execute function membership_private.sync_auth_member();
