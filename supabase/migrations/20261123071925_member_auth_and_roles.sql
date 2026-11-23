create schema if not exists membership_private;
revoke all on schema membership_private from public, anon, authenticated;

create table public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 80),
  email text not null,
  email_confirmed_at timestamptz,
  policy_version text not null,
  privacy_consented_at timestamptz not null default now(),
  overseas_consented_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index member_profiles_created_at_idx on public.member_profiles(created_at desc, user_id);
alter table public.member_profiles enable row level security;
revoke all on public.member_profiles from public, anon, authenticated;
grant select on public.member_profiles to authenticated;

create table public.member_administrators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.member_administrators enable row level security;
revoke all on public.member_administrators from public, anon, authenticated;
grant select on public.member_administrators to authenticated;

create policy member_administrator_read_own on public.member_administrators
for select to authenticated using ((select auth.uid()) = user_id);
create policy member_profile_read_own on public.member_profiles
for select to authenticated using ((select auth.uid()) = user_id);
create policy member_profile_read_by_administrator on public.member_profiles
for select to authenticated using (
  exists (
    select 1 from public.member_administrators a
    where a.user_id = (select auth.uid()) and a.is_active
  )
);

create table membership_private.administrator_invitations (
  email text primary key check (email = lower(email)),
  claimed_user_id uuid,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table membership_private.administrator_invitations enable row level security;
revoke all on membership_private.administrator_invitations from public, anon, authenticated;

-- Auth inserts run without a member auth.uid(). A narrowly scoped trigger must
-- write the read-only profile and claim preapproved invitations, never client roles.
create function membership_private.sync_auth_member()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_schema <> 'auth' or tg_table_name <> 'users' then
    raise exception 'Invalid trigger source';
  end if;
  if tg_op = 'INSERT' then
    if new.raw_user_meta_data->>'membership_policy_version' is distinct from '2026-11-23'
      or new.raw_user_meta_data->>'privacy_consent' is distinct from 'true'
      or new.raw_user_meta_data->>'overseas_consent' is distinct from 'true'
      or new.raw_user_meta_data->>'age_14_or_older' is distinct from 'true'
      or char_length(btrim(coalesce(new.raw_user_meta_data->>'full_name', ''))) not between 1 and 80
    then raise exception 'Membership consent and valid name required';
    end if;
  end if;

  insert into public.member_profiles(user_id, full_name, email, email_confirmed_at, policy_version, created_at)
  values (
    new.id,
    coalesce(nullif(left(btrim(new.raw_user_meta_data->>'full_name'), 80), ''), '회원'),
    lower(new.email), new.email_confirmed_at,
    '2026-11-23', coalesce(new.created_at, now())
  )
  on conflict (user_id) do update set
    full_name = excluded.full_name, email = excluded.email,
    email_confirmed_at = excluded.email_confirmed_at;

  if tg_op = 'UPDATE' then
    if new.email is distinct from old.email or new.email_confirmed_at is null then
      update public.member_administrators set is_active = false where user_id = new.id;
    end if;
  end if;

  if new.email_confirmed_at is not null then
    with invitation as (
      update membership_private.administrator_invitations
      set claimed_user_id = new.id, claimed_at = now()
      where email = lower(new.email) and claimed_at is null
      returning email
    )
    insert into public.member_administrators(user_id)
    select new.id from invitation
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function membership_private.sync_auth_member() from public, anon, authenticated;
create trigger sync_membership_after_auth_insert
after insert on auth.users for each row execute function membership_private.sync_auth_member();
create trigger sync_membership_after_auth_update
after update of email, email_confirmed_at, raw_user_meta_data on auth.users
for each row execute function membership_private.sync_auth_member();
