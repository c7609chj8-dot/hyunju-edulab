-- Requires the approved enrollment migration and one existing verified member.
-- Run as postgres. No account/profile is created, modified or deleted.
begin read only;
do $$ begin
  perform set_config('membership_enrollment.profile_fingerprint',(select md5(coalesce(jsonb_agg(to_jsonb(p) order by user_id)::text,'[]')) from public.member_profiles p),true);
  perform set_config('membership_enrollment.administrator_fingerprint',(select md5(coalesce(jsonb_agg(to_jsonb(a) order by user_id)::text,'[]')) from public.member_administrators a),true);
  perform set_config('membership_enrollment.audit_count',(select count(*)::text from public.member_account_audit_logs),true);
  perform set_config('membership_enrollment.auth_count',(select count(*)::text from auth.users),true);
  if exists(select 1 from auth.users where id='51000000-0000-4000-8000-000000000001') then
    raise exception 'Unknown-identity test ID collision';
  end if;
end $$;
do $$
declare admin_id uuid; returned_id uuid; rejected boolean:=false;
begin
  if (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where p.proname='enroll_current_member' and n.nspname in('public','membership_private'))<>2
  then raise exception 'Expected exactly two enrollment functions'; end if;
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where p.proname='enroll_current_member' and n.nspname='public'
        and not p.prosecdef and p.pronargs=8)
    or not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where p.proname='enroll_current_member' and n.nspname='membership_private'
        and p.prosecdef and p.pronargs=8)
  then raise exception 'Function security mode mismatch'; end if;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where p.proname='enroll_current_member' and n.nspname in('public','membership_private')
      and (not has_function_privilege('authenticated',p.oid,'EXECUTE')
        or has_function_privilege('anon',p.oid,'EXECUTE')
        or exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE')
        or not exists(select 1 from unnest(p.proconfig) option where replace(option,'"','')='search_path=')))
  then raise exception 'Function privilege/search_path mismatch'; end if;

  perform set_config('request.jwt.claims','{}',true);
  begin
    perform public.enroll_current_member('검증',null,null,null,'2026-11-23.2',true,true,true);
  exception when insufficient_privilege then rejected:=true;
  end;
  if not rejected then raise exception 'Missing identity accepted'; end if;

  select a.user_id into admin_id from public.member_administrators a
    join public.member_profiles p on p.user_id=a.user_id join auth.users u on u.id=a.user_id
    where a.is_active and p.account_status='active' and u.email_confirmed_at is not null
      and u.is_anonymous is not true and (u.banned_until is null or u.banned_until<now()) limit 1;
  if admin_id is null then raise exception 'No existing verified member available'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$ declare returned_id uuid; rejected boolean:=false; begin
  returned_id:=public.enroll_current_member('검증용:기존정보수정금지',null,null,null,'2026-11-23.2',true,true,true);
  if returned_id is distinct from auth.uid() then raise exception 'Existing member identity mismatch'; end if;
  begin
    perform public.enroll_current_member('검증',null,null,null,'2026-11-23.2',false,true,true);
  exception when check_violation then rejected:=true;
  end;
  if not rejected then raise exception 'Missing consent accepted'; end if;
  perform set_config('request.jwt.claims','{"sub":"51000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
  rejected:=false;
  begin
    perform public.enroll_current_member('검증',null,null,null,'2026-11-23.2',true,true,true);
  exception when insufficient_privilege then rejected:=true;
  end;
  if not rejected then raise exception 'Unknown Auth account accepted'; end if;
end $$;
reset role;
set local role anon;
do $$ declare rejected boolean:=false; begin
  begin
    perform public.enroll_current_member('검증',null,null,null,'2026-11-23.2',true,true,true);
  exception when insufficient_privilege then rejected:=true;
  end;
  if not rejected then raise exception 'Anonymous RPC execution allowed'; end if;
end $$;
reset role;
do $$ begin
  if (select md5(coalesce(jsonb_agg(to_jsonb(p) order by user_id)::text,'[]')) from public.member_profiles p)<>current_setting('membership_enrollment.profile_fingerprint')
    or (select md5(coalesce(jsonb_agg(to_jsonb(a) order by user_id)::text,'[]')) from public.member_administrators a)<>current_setting('membership_enrollment.administrator_fingerprint')
    or (select count(*) from public.member_account_audit_logs)<>current_setting('membership_enrollment.audit_count')::bigint
    or (select count(*) from auth.users)<>current_setting('membership_enrollment.auth_count')::bigint
  then raise exception 'Existing membership records changed; investigate before continuing'; end if;
end $$;
rollback;
select 'PASS: function modes, fixed search_path, authenticated-only execution, missing/unknown identity and consent rejection, existing-member no-op, anonymous denial and unchanged membership fingerprints; READ ONLY verification' as result;
