-- REVIEW ONLY. NOT APPROVED OR EXECUTED. This script contains DROP statements.
-- First disable the EDULAB intake/admin endpoints and stop their traffic.
-- Obtain separate rollback approval. Back up and verify restore before any
-- data-bearing rollback. This script refuses ALL non-empty edulab tables.
-- To approve an EMPTY rollback, the operator must add, INSIDE this transaction:
-- SET LOCAL edulab.allow_empty_rollback = 'approved-empty-only';
begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';

do $$ begin
  if current_setting('edulab.allow_empty_rollback',true) is distinct from 'approved-empty-only' then
    raise exception 'Rollback disabled: separate explicit approval required';
  end if;
end $$;

-- Lock our NEW tables only, preventing a race between empty checks and DROP.
lock table public.edulab_inquiry_history, public.edulab_inquiries,
  public.edulab_admins in access exclusive mode;
do $$ begin
  if exists(select 1 from public.edulab_inquiries)
    or exists(select 1 from public.edulab_inquiry_history)
    or exists(select 1 from public.edulab_admins) then
    raise exception 'Data exists: stop; preserve data and prepare a reviewed recovery plan';
  end if;
end $$;

-- RESTRICT: unknown external dependencies abort the transaction. No CASCADE.
drop function public.edulab_change_inquiry_status(uuid,integer,text,uuid) restrict;
drop function public.edulab_create_inquiry(jsonb) restrict;
drop table public.edulab_inquiry_history restrict;
drop table public.edulab_inquiries restrict;
drop table public.edulab_admins restrict;
drop function edulab_private.edulab_change_inquiry_status(uuid,integer,text,uuid) restrict;
drop function edulab_private.edulab_is_admin() restrict;
drop schema edulab_private restrict;

-- Never delete/edit supabase_migrations history. Record an approved rollback
-- as its own migration instead. Any error requires ROLLBACK, not partial retry.
commit;
