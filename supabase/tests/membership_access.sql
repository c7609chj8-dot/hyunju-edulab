begin;
insert into membership_private.administrator_invitations(email) values ('codex-membership-admin@example.invalid');
insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at)
values
('10000000-0000-4000-8000-000000000001','codex-membership-one@example.invalid','{"full_name":"검증 회원1","membership_policy_version":"2026-11-23","privacy_consent":true,"overseas_consent":true,"age_14_or_older":true,"role":"administrator"}',now()),
('10000000-0000-4000-8000-000000000002','codex-membership-two@example.invalid','{"full_name":"검증 회원2","membership_policy_version":"2026-11-23","privacy_consent":true,"overseas_consent":true,"age_14_or_older":true}',now()),
('10000000-0000-4000-8000-000000000003','codex-membership-admin@example.invalid','{"full_name":"검증 관리자","membership_policy_version":"2026-11-23","privacy_consent":true,"overseas_consent":true,"age_14_or_older":true}',null);
do $$ begin
  if exists(select 1 from public.member_administrators where user_id='10000000-0000-4000-8000-000000000003') then raise exception 'Unverified invitation was granted'; end if;
  if exists(select 1 from public.member_administrators where user_id='10000000-0000-4000-8000-000000000001') then raise exception 'User metadata granted an admin role'; end if;
end $$;
update auth.users set email_confirmed_at=now() where id='10000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
  if (select count(*) from public.member_profiles) <> 1 then raise exception 'Ordinary member isolation failed'; end if;
  if (select count(*) from public.member_administrators) <> 0 then raise exception 'Ordinary member read administrator roles'; end if;
  begin
    insert into public.member_administrators(user_id) values ('10000000-0000-4000-8000-000000000001');
    raise exception 'Member could grant an administrator role';
  exception when insufficient_privilege then null; end;
  begin
    update public.member_profiles set email='other@example.invalid';
    raise exception 'Member could directly overwrite profiles';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $$ begin
  if (select count(*) from public.member_profiles where email like 'codex-membership-%@example.invalid') <> 3 then raise exception 'Administrator cannot read members'; end if;
end $$;
reset role;
update public.member_administrators set is_active=false where user_id='10000000-0000-4000-8000-000000000003';
set local role authenticated;
do $$ begin
  if (select count(*) from public.member_profiles) <> 1 then raise exception 'Revoked administrator still reads members'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform 1 from public.member_profiles limit 1;
    raise exception 'Anonymous role can read member profiles';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'membership isolation, invitation verification, metadata forgery, write protection, role revocation, anonymous denial: passed; fixtures rolled back' as result;
