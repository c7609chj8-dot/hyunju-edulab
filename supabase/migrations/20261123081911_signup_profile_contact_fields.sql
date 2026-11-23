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
    insert into public.member_profiles(user_id,full_name,username,address,phone,email,email_confirmed_at,policy_version,privacy_consented_at,overseas_consented_at,created_at)
    values(new.id,btrim(new.raw_user_meta_data->>'full_name'),nullif(lower(btrim(new.raw_user_meta_data->>'username')),''),nullif(btrim(new.raw_user_meta_data->>'address'),''),nullif(btrim(new.raw_user_meta_data->>'phone'),''),lower(new.email),new.email_confirmed_at,'2026-11-23.2',now(),now(),coalesce(new.created_at,now()));
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
