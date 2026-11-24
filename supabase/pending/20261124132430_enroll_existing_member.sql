-- APPROVAL REQUIRED: prepared locally; do not apply to the hosted DB yet.
-- Adds two new functions only. No table/trigger/policy replacement or data backfill.
begin;

create function membership_private.enroll_current_member(
  p_full_name text, p_username text, p_address text, p_phone text,
  p_policy_version text, p_privacy_consent boolean,
  p_overseas_consent boolean, p_age_confirmed boolean
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_email text;
  existing_status text;
begin
  if actor is null then
    raise exception 'Verified account required' using errcode = '42501';
  end if;
  select lower(u.email) into actor_email from auth.users u
  where u.id = actor and u.email is not null
    and u.email_confirmed_at is not null and u.is_anonymous is not true
    and (u.banned_until is null or u.banned_until < now());
  if not found then
    raise exception 'Verified active account required' using errcode = '42501';
  end if;
  if p_policy_version is distinct from '2026-11-23.2'
    or p_privacy_consent is distinct from true
    or p_overseas_consent is distinct from true
    or p_age_confirmed is distinct from true then
    raise exception 'Membership consent required' using errcode = '23514';
  end if;

  select account_status into existing_status from public.member_profiles where user_id = actor;
  if found then
    if existing_status <> 'active' then
      raise exception 'Account unavailable' using errcode = '42501';
    end if;
    return actor; -- Never overwrite an existing member or their consent records.
  end if;

  -- Existing table constraints enforce name, username, address and phone limits.
  insert into public.member_profiles(
    user_id, full_name, username, address, phone, email, email_confirmed_at,
    policy_version, privacy_consented_at, overseas_consented_at
  )
  select actor, btrim(p_full_name), nullif(lower(btrim(p_username)), ''),
    nullif(btrim(p_address), ''),
    nullif(regexp_replace(coalesce(p_phone, ''), '[[:space:]-]', '', 'g'), ''),
    actor_email, u.email_confirmed_at, p_policy_version, now(), now()
  from auth.users u where u.id = actor
  on conflict (user_id) do nothing;

  select account_status into existing_status from public.member_profiles where user_id = actor;
  if not found or existing_status <> 'active' then
    raise exception 'Account unavailable' using errcode = '42501';
  end if;
  return actor;
end;
$$;

revoke all on function membership_private.enroll_current_member(text,text,text,text,text,boolean,boolean,boolean) from public, anon, authenticated;
grant execute on function membership_private.enroll_current_member(text,text,text,text,text,boolean,boolean,boolean) to authenticated;

-- The exposed RPC is an invoker wrapper. Privileged code stays in a private schema.
create function public.enroll_current_member(
  p_full_name text, p_username text, p_address text, p_phone text,
  p_policy_version text, p_privacy_consent boolean,
  p_overseas_consent boolean, p_age_confirmed boolean
)
returns uuid language sql security invoker set search_path = ''
as $$
  select membership_private.enroll_current_member(
    p_full_name, p_username, p_address, p_phone, p_policy_version,
    p_privacy_consent, p_overseas_consent, p_age_confirmed
  );
$$;

revoke all on function public.enroll_current_member(text,text,text,text,text,boolean,boolean,boolean) from public, anon, authenticated;
grant execute on function public.enroll_current_member(text,text,text,text,text,boolean,boolean,boolean) to authenticated;

commit;
