begin;

-- A failed signup must leave neither an Auth account nor a profile.
do $$
begin
  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (
      '40000000-0000-4000-8000-000000000003',
      'signup-no-consent@example.invalid',
      '{"membership_app":"hyunju-edulab","full_name":"Missing consent","membership_policy_version":"2026-11-23.2"}'
    );
    raise exception 'Signup unexpectedly accepted missing consent';
  exception when raise_exception then
    if sqlerrm <> 'Membership consent required' then raise; end if;
  end;
  if exists (
    select 1 from auth.users where id = '40000000-0000-4000-8000-000000000003'
  ) then raise exception 'Rejected Auth account was retained'; end if;
end;
$$;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('40000000-0000-4000-8000-000000000001', 'Signup-Test@example.invalid',
   '{"membership_app":"hyunju-edulab","full_name":"  Signup Tester  ","username":" SIGNUP_TEST ","address":" Fixture Street ","phone":"01012345678","membership_policy_version":"2026-11-23.2","privacy_consent":true,"overseas_consent":true,"age_14_or_older":true}'),
  ('40000000-0000-4000-8000-000000000002', 'signup-minimal@example.invalid',
   '{"membership_app":"hyunju-edulab","full_name":"Minimal Signup","membership_policy_version":"2026-11-23.2","privacy_consent":true,"overseas_consent":true,"age_14_or_older":true}');

do $$
begin
  if not exists (
    select 1 from public.member_profiles
    where user_id = '40000000-0000-4000-8000-000000000001'
      and full_name = 'Signup Tester' and email = 'signup-test@example.invalid'
      and username = 'signup_test' and address = 'Fixture Street' and phone = '01012345678'
      and policy_version = '2026-11-23.2'
      and privacy_consented_at is not null and overseas_consented_at is not null
      and email_confirmed_at is null and account_status = 'active'
  ) then raise exception 'Signup profile fields were not saved correctly'; end if;

  if not exists (
    select 1 from public.member_profiles
    where user_id = '40000000-0000-4000-8000-000000000002'
      and username is null and address is null and phone is null
  ) then raise exception 'Optional fields prevented minimal signup'; end if;
end;
$$;

update auth.users set email_confirmed_at = now()
where id = '40000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
begin
  if (select count(*) from public.member_profiles) <> 1 then
    raise exception 'Member profile isolation failed';
  end if;
  if not exists (
    select 1 from public.member_profiles
    where user_id = auth.uid() and email_confirmed_at is not null
  ) then raise exception 'Email confirmation did not sync'; end if;
end;
$$;

reset role;
rollback;
select 'signup profile, consent, optional fields, email confirmation and row isolation passed' as result;
