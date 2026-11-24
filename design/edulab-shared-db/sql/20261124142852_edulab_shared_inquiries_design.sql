-- DESIGN ONLY / NOT APPROVED / NOT EXECUTED.
-- Target: existing PRODUCTION ai-education-hub-dev (uenvjqgylrevujdjpfed).
-- Do not bulk-apply this branch's old test-project migrations.
-- No seeds, existing-table changes, extensions, global defaults, jobs or backfill.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';

-- CREATE (without IF NOT EXISTS / OR REPLACE) fails on collisions.
create schema edulab_private;
revoke all on schema edulab_private from public, anon, authenticated, service_role;
grant usage on schema edulab_private to authenticated;

create table public.edulab_admins (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default false,
  created_at timestamptz not null default statement_timestamp(),
  revoked_at timestamptz,
  constraint edulab_admin_revocation_check check (not is_active or revoked_at is null)
);

create table public.edulab_inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_number text not null unique check (inquiry_number ~ '^EL-[A-HJ-NP-Z2-9]{12}$'),
  idempotency_key_hash text not null unique check (idempotency_key_hash ~ '^[0-9a-f]{64}$'),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  program_slug text check (program_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  category text not null check (category in ('safety','ai','lecture','collaboration')),
  sender_name text not null check (char_length(btrim(sender_name)) between 1 and 80),
  sender_contact text not null check (
    char_length(btrim(sender_contact)) between 7 and 50
    and sender_contact ~ '^[0-9+().[:space:]-]+$'
  ),
  sender_email text check (sender_email is null or (
    char_length(sender_email) between 3 and 254
    and sender_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  )),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  privacy_consent boolean not null check (privacy_consent),
  privacy_policy_version text not null check (char_length(btrim(privacy_policy_version)) between 1 and 64),
  privacy_notice_hash text not null check (privacy_notice_hash ~ '^[0-9a-f]{64}$'),
  privacy_consented_at timestamptz not null default statement_timestamp(),
  retention_days integer not null check (retention_days between 1 and 3650),
  retention_due_at timestamptz not null,
  status text not null default 'received' check (status in ('received','reviewing','answered')),
  revision integer not null default 1 check (revision >= 1),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint edulab_inquiry_retention_check check (retention_due_at > created_at),
  constraint edulab_inquiry_time_check check (updated_at >= created_at)
);
create index edulab_inquiries_status_created_idx
  on public.edulab_inquiries(status, created_at desc, id);
create index edulab_inquiries_retention_idx on public.edulab_inquiries(retention_due_at);

-- One history table replaces the old branch's duplicated event + audit tables.
-- No message, email, phone, IP or free-text admin note is copied into history.
create table public.edulab_inquiry_history (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.edulab_inquiries(id) on delete cascade,
  inquiry_revision integer not null check (inquiry_revision >= 1),
  event_type text not null check (event_type in ('submitted','status_changed')),
  actor_type text not null check (actor_type in ('system','edulab_admin')),
  actor_user_id uuid,
  previous_status text check (previous_status in ('received','reviewing','answered')),
  next_status text not null check (next_status in ('received','reviewing','answered')),
  request_id uuid,
  created_at timestamptz not null default statement_timestamp(),
  unique(inquiry_id, inquiry_revision),
  constraint edulab_history_shape_check check (
    (event_type='submitted' and actor_type='system' and actor_user_id is null
      and previous_status is null and next_status='received' and inquiry_revision=1)
    or (event_type='status_changed' and actor_type='edulab_admin' and actor_user_id is not null
      and previous_status is not null and previous_status<>next_status and inquiry_revision>1)
  )
);

alter table public.edulab_admins enable row level security;
alter table public.edulab_inquiries enable row level security;
alter table public.edulab_inquiry_history enable row level security;
revoke all on table public.edulab_admins, public.edulab_inquiries,
  public.edulab_inquiry_history from public, anon, authenticated, service_role;

grant select on public.edulab_admins, public.edulab_inquiries,
  public.edulab_inquiry_history to authenticated;
-- Intake server only. Status changes must use the user's JWT, not service_role.
grant select, insert on public.edulab_inquiries to service_role;
grant insert on public.edulab_inquiry_history to service_role;

create function edulab_private.edulab_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.edulab_admins a join auth.users u on u.id=a.auth_user_id
    where a.auth_user_id=(select auth.uid()) and a.is_active
      and a.revoked_at is null and u.email_confirmed_at is not null
      and u.is_anonymous is not true and (u.banned_until is null or u.banned_until<now())
      and exists(select 1 from auth.sessions s where s.user_id=u.id
        and s.id::text=(select auth.jwt()->>'session_id')
        and (s.not_after is null or s.not_after>now()))
  );
$$;
revoke all on function edulab_private.edulab_is_admin() from public, anon, authenticated, service_role;
grant execute on function edulab_private.edulab_is_admin() to authenticated;

create policy edulab_admin_read_self on public.edulab_admins
  for select to authenticated using (auth_user_id=(select auth.uid()));
create policy edulab_inquiry_admin_read on public.edulab_inquiries
  for select to authenticated using ((select edulab_private.edulab_is_admin()));
create policy edulab_history_admin_read on public.edulab_inquiry_history
  for select to authenticated using ((select edulab_private.edulab_is_admin()));
-- No anon policy, authenticated INSERT/UPDATE/DELETE policy or role self-assignment.

-- Server intake RPC. It cannot be called by browser anon/authenticated roles.
-- The Next.js API must validate, rate-limit, verify bot challenges and set trusted
-- policy/retention/HMAC fields BEFORE using the server-only key to call this RPC.
create function public.edulab_create_inquiry(p_payload jsonb)
returns table(outcome text, inquiry_number text, created_at timestamptz)
language plpgsql security invoker set search_path = ''
as $$
declare
  v_id uuid;
  v_number text := p_payload->>'inquiry_number';
  v_key text := p_payload->>'idempotency_key_hash';
  v_fingerprint text := p_payload->>'request_fingerprint';
  v_received timestamptz := statement_timestamp();
  v_days integer := (p_payload->>'retention_days')::integer;
  v_existing public.edulab_inquiries%rowtype;
begin
  if jsonb_typeof(p_payload) is distinct from 'object'
    or (p_payload->'privacy_consent') is distinct from 'true'::jsonb then
    raise exception 'Valid consent and object required' using errcode='23514';
  end if;
  insert into public.edulab_inquiries (
    inquiry_number,idempotency_key_hash,request_fingerprint,program_slug,category,
    sender_name,sender_contact,sender_email,message,privacy_consent,
    privacy_policy_version,privacy_notice_hash,privacy_consented_at,
    retention_days,retention_due_at,created_at,updated_at
  ) values (
    v_number,v_key,v_fingerprint,nullif(btrim(p_payload->>'program_slug'),''),p_payload->>'category',
    btrim(p_payload->>'sender_name'),btrim(p_payload->>'sender_contact'),
    nullif(btrim(p_payload->>'sender_email'),''),btrim(p_payload->>'message'),true,
    p_payload->>'privacy_policy_version',p_payload->>'privacy_notice_hash',v_received,
    v_days,v_received+make_interval(days=>v_days),v_received,v_received
  ) on conflict (idempotency_key_hash) do nothing returning id into v_id;

  if v_id is null then
    select q.* into v_existing from public.edulab_inquiries q where q.idempotency_key_hash=v_key;
    if not found then raise exception 'Retry transaction' using errcode='40001'; end if;
    if v_existing.request_fingerprint=v_fingerprint then
      return query select 'replayed'::text,v_existing.inquiry_number,v_existing.created_at;
    else
      return query select 'idempotency_conflict'::text,null::text,null::timestamptz;
    end if;
    return;
  end if;

  insert into public.edulab_inquiry_history(
    inquiry_id,inquiry_revision,event_type,actor_type,previous_status,next_status,created_at
  ) values(v_id,1,'submitted','system',null,'received',v_received);
  return query select 'created'::text,v_number,v_received;
end;
$$;
revoke all on function public.edulab_create_inquiry(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.edulab_create_inquiry(jsonb) to service_role;

-- Identity is always derived from the authenticated JWT, never a supplied actor ID.
create function edulab_private.edulab_change_inquiry_status(
  p_inquiry_id uuid, p_expected_revision integer, p_next_status text, p_request_id uuid
)
returns table(outcome text, status text, revision integer)
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_current public.edulab_inquiries%rowtype;
  v_changed timestamptz;
begin
  if not edulab_private.edulab_is_admin() then
    raise exception 'Edulab administrator required' using errcode='42501';
  end if;
  -- Hold only our own admin row so revocation and this change serialize.
  perform 1 from public.edulab_admins a
    where a.auth_user_id=v_actor and a.is_active and a.revoked_at is null for share;
  if not found then raise exception 'Edulab administrator required' using errcode='42501'; end if;
  select q.* into v_current from public.edulab_inquiries q where q.id=p_inquiry_id for update;
  if not found then
    return query select 'not_found'::text,null::text,null::integer; return;
  end if;
  if p_expected_revision is null or v_current.revision<>p_expected_revision then
    return query select 'revision_conflict'::text,v_current.status,v_current.revision; return;
  end if;
  if v_current.status=p_next_status then
    return query select 'same_status'::text,v_current.status,v_current.revision; return;
  end if;
  if p_next_status is null or not (
    (v_current.status='received' and p_next_status='reviewing')
    or (v_current.status='reviewing' and p_next_status='answered')
  ) then
    return query select 'invalid_transition'::text,v_current.status,v_current.revision; return;
  end if;

  v_changed := greatest(clock_timestamp(),v_current.updated_at);
  update public.edulab_inquiries q set
    status=p_next_status, revision=q.revision+1, updated_at=v_changed
    where q.id=p_inquiry_id and q.revision=p_expected_revision;
  insert into public.edulab_inquiry_history(
    inquiry_id,inquiry_revision,event_type,actor_type,actor_user_id,
    previous_status,next_status,request_id,created_at
  ) values(v_current.id,v_current.revision+1,'status_changed','edulab_admin',v_actor,
    v_current.status,p_next_status,p_request_id,v_changed);
  return query select 'updated'::text,p_next_status,v_current.revision+1;
end;
$$;
revoke all on function edulab_private.edulab_change_inquiry_status(uuid,integer,text,uuid)
  from public, anon, authenticated, service_role;
grant execute on function edulab_private.edulab_change_inquiry_status(uuid,integer,text,uuid) to authenticated;

create function public.edulab_change_inquiry_status(
  p_inquiry_id uuid, p_expected_revision integer, p_next_status text, p_request_id uuid
)
returns table(outcome text, status text, revision integer)
language sql security invoker set search_path = ''
as $$
  select * from edulab_private.edulab_change_inquiry_status(
    p_inquiry_id,p_expected_revision,p_next_status,p_request_id
  );
$$;
revoke all on function public.edulab_change_inquiry_status(uuid,integer,text,uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.edulab_change_inquiry_status(uuid,integer,text,uuid) to authenticated;

commit;
