begin;
insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at)
values
('30000000-0000-4000-8000-000000000001','codex-admin-check-member@example.invalid','{"membership_app":"hyunju-edulab","full_name":"검증 회원","membership_policy_version":"2026-11-23.2","privacy_consent":true,"overseas_consent":true,"age_14_or_older":true,"role":"administrator"}',now()),
('30000000-0000-4000-8000-000000000002','codex-admin-check-operator@example.invalid','{"membership_app":"hyunju-edulab","full_name":"검증 관리자","membership_policy_version":"2026-11-23.2","privacy_consent":true,"overseas_consent":true,"age_14_or_older":true}',now());
insert into public.member_administrators(user_id) values('30000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ declare changed integer; begin
  if (select count(*) from public.member_profiles)<>1 then raise exception 'Member isolation failed'; end if;
  if (select count(*) from public.member_administrators)<>0 then raise exception 'Metadata role forgery succeeded'; end if;
  update public.member_profiles set full_name='unauthorized' where user_id='30000000-0000-4000-8000-000000000001';
  get diagnostics changed=row_count;
  if changed<>0 then raise exception 'Member modified an account'; end if;
  if (select count(*) from public.member_account_audit_logs)<>0 then raise exception 'Member read audit records'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
update public.member_profiles set full_name='수정한 회원',username='codex_check',address='검증용 주소',phone='01012345678'
where user_id='30000000-0000-4000-8000-000000000001' and revision=1;
do $$ declare changed integer; blocked boolean:=false; begin
  if not exists(select 1 from public.member_profiles where user_id='30000000-0000-4000-8000-000000000001' and revision=2 and phone='01012345678') then raise exception 'Admin update failed'; end if;
  if (select count(*) from public.member_account_audit_logs where target_user_id='30000000-0000-4000-8000-000000000001')<>1 then raise exception 'Audit missing'; end if;
  update public.member_profiles set full_name='stale update' where user_id='30000000-0000-4000-8000-000000000001' and revision=1;
  get diagnostics changed=row_count;
  if changed<>0 then raise exception 'Stale revision overwrote data'; end if;
  begin
    update public.member_profiles set account_status='suspended' where user_id='30000000-0000-4000-8000-000000000002';
  exception when sqlstate 'P0001' then blocked:=true; end;
  if not blocked then raise exception 'Admin self suspension allowed'; end if;
end $$;
update public.member_profiles set account_status='suspended' where user_id='30000000-0000-4000-8000-000000000001' and revision=2;
update public.member_profiles set account_status='active' where user_id='30000000-0000-4000-8000-000000000001' and revision=3;
do $$ begin
  if not exists(select 1 from public.member_profiles where user_id='30000000-0000-4000-8000-000000000001' and revision=4 and account_status='active') then raise exception 'Suspension/recovery failed'; end if;
end $$;

reset role;
update public.member_administrators set is_active=false where user_id='30000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$ begin
  if (select count(*) from public.member_profiles)<>1 then raise exception 'Revoked admin retained access'; end if;
end $$;
reset role;
set local role anon;
do $$ declare blocked boolean:=false; begin
  begin perform 1 from public.member_profiles; exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'Anonymous access allowed'; end if;
end $$;
reset role;
rollback;
select 'admin CRUD, audit, stale revision, member isolation, suspension/recovery, admin self-protection, role revocation and anonymous denial passed; fixtures rolled back' as result;
