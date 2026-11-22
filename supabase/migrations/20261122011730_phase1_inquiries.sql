-- Phase 1 inquiry storage for the isolated Supabase test project.
-- This migration does not enable public inquiry intake. The Next.js route
-- remains gated by INQUIRY_API_ENABLED=false until separate approval.

create extension if not exists pgcrypto with schema extensions;

create type public.inquiry_category as enum (
  'safety',
  'ai',
  'lecture',
  'collaboration'
);

create type public.inquiry_status as enum (
  'received',
  'reviewing',
  'answered'
);

create type public.inquiry_event_type as enum (
  'submitted',
  'status_changed'
);

create type public.inquiry_actor_type as enum (
  'system',
  'administrator'
);

create table public.administrator_roles (
  auth_user_id uuid primary key references auth.users (id) on delete restrict,
  role text not null default 'administrator' check (role = 'administrator'),
  is_active boolean not null default true,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- The approved operating model has exactly one active representative account.
create unique index administrator_roles_one_active_administrator
  on public.administrator_roles (role)
  where is_active;

create table public.inquiries (
  id uuid primary key,
  inquiry_number text not null unique check (inquiry_number ~ '^HJ-[A-HJ-NP-Z2-9]{12}$'),
  idempotency_key_hash char(64) not null unique check (idempotency_key_hash ~ '^[0-9a-f]{64}$'),
  request_fingerprint char(64) not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  program_slug text,
  category public.inquiry_category not null,
  sender_name varchar(80) not null check (char_length(btrim(sender_name)) between 1 and 80),
  sender_contact varchar(50) not null check (char_length(btrim(sender_contact)) between 1 and 50),
  sender_email varchar(254) check (sender_email is null or char_length(btrim(sender_email)) between 3 and 254),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  privacy_policy_version varchar(64) not null check (char_length(btrim(privacy_policy_version)) between 1 and 64),
  privacy_consented_at timestamptz not null,
  status public.inquiry_status not null default 'received',
  revision integer not null default 1 check (revision >= 1),
  retention_due_at timestamptz not null,
  purged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inquiries_status_created_at_idx
  on public.inquiries (status, created_at desc);

create index inquiries_retention_due_at_idx
  on public.inquiries (retention_due_at)
  where purged_at is null;

create table public.inquiry_events (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete restrict,
  actor_type public.inquiry_actor_type not null,
  actor_user_id uuid,
  event_type public.inquiry_event_type not null,
  previous_status public.inquiry_status,
  next_status public.inquiry_status,
  created_at timestamptz not null default now(),
  check (
    (
      event_type = 'submitted'
      and actor_type = 'system'
      and actor_user_id is null
      and previous_status is null
      and next_status = 'received'
    )
    or
    (
      event_type = 'status_changed'
      and actor_type = 'administrator'
      and actor_user_id is not null
      and previous_status is not null
      and next_status is not null
      and previous_status <> next_status
    )
  )
);

create index inquiry_events_inquiry_created_at_idx
  on public.inquiry_events (inquiry_id, created_at asc);

create table public.administrator_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  action text not null check (action = 'status_changed'),
  target_type text not null check (target_type = 'inquiry'),
  target_id uuid not null references public.inquiries (id) on delete restrict,
  previous_status public.inquiry_status not null,
  next_status public.inquiry_status not null,
  request_id uuid,
  created_at timestamptz not null default now()
);

create index administrator_audit_logs_target_created_at_idx
  on public.administrator_audit_logs (target_id, created_at asc);

-- Public clients never receive a table privilege. RLS is enabled as a second
-- barrier in case a future grant is made accidentally. The service-role key
-- is used only by server-side Route Handlers after their own authentication
-- and authorization checks.
alter table public.administrator_roles enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_events enable row level security;
alter table public.administrator_audit_logs enable row level security;

revoke all on table public.administrator_roles from anon, authenticated;
revoke all on table public.inquiries from anon, authenticated;
revoke all on table public.inquiry_events from anon, authenticated;
revoke all on table public.administrator_audit_logs from anon, authenticated;

create policy "deny_browser_administrator_roles"
  on public.administrator_roles for all to anon, authenticated
  using (false) with check (false);

create policy "deny_browser_inquiries"
  on public.inquiries for all to anon, authenticated
  using (false) with check (false);

create policy "deny_browser_inquiry_events"
  on public.inquiry_events for all to anon, authenticated
  using (false) with check (false);

create policy "deny_browser_administrator_audit_logs"
  on public.administrator_audit_logs for all to anon, authenticated
  using (false) with check (false);

create or replace function public.create_inquiry(
  p_id uuid,
  p_inquiry_number text,
  p_idempotency_key_hash text,
  p_request_fingerprint text,
  p_program_slug text,
  p_category public.inquiry_category,
  p_sender_name text,
  p_sender_contact text,
  p_sender_email text,
  p_message text,
  p_privacy_policy_version text,
  p_privacy_consented_at timestamptz,
  p_retention_due_at timestamptz,
  p_created_at timestamptz
)
returns table (
  outcome text,
  inquiry_number text,
  created_at timestamptz
)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  existing_inquiry public.inquiries%rowtype;
begin
  select *
    into existing_inquiry
    from public.inquiries
   where idempotency_key_hash = p_idempotency_key_hash
   for update;

  if found then
    if existing_inquiry.request_fingerprint = p_request_fingerprint then
      return query
        select 'replayed'::text, existing_inquiry.inquiry_number, existing_inquiry.created_at;
    else
      return query select 'idempotency_conflict'::text, null::text, null::timestamptz;
    end if;
    return;
  end if;

  begin
    insert into public.inquiries (
      id,
      inquiry_number,
      idempotency_key_hash,
      request_fingerprint,
      program_slug,
      category,
      sender_name,
      sender_contact,
      sender_email,
      message,
      privacy_policy_version,
      privacy_consented_at,
      retention_due_at,
      created_at,
      updated_at
    )
    values (
      p_id,
      p_inquiry_number,
      lower(p_idempotency_key_hash),
      lower(p_request_fingerprint),
      nullif(btrim(p_program_slug), ''),
      p_category,
      btrim(p_sender_name),
      btrim(p_sender_contact),
      nullif(btrim(p_sender_email), ''),
      btrim(p_message),
      btrim(p_privacy_policy_version),
      p_privacy_consented_at,
      p_retention_due_at,
      p_created_at,
      p_created_at
    );
  exception when unique_violation then
    select *
      into existing_inquiry
      from public.inquiries
     where idempotency_key_hash = p_idempotency_key_hash
     for update;

    if not found then
      raise;
    end if;

    if existing_inquiry.request_fingerprint = p_request_fingerprint then
      return query
        select 'replayed'::text, existing_inquiry.inquiry_number, existing_inquiry.created_at;
    else
      return query select 'idempotency_conflict'::text, null::text, null::timestamptz;
    end if;
    return;
  end;

  insert into public.inquiry_events (
    inquiry_id,
    actor_type,
    actor_user_id,
    event_type,
    previous_status,
    next_status,
    created_at
  )
  values (
    p_id,
    'system',
    null,
    'submitted',
    null,
    'received',
    p_created_at
  );

  return query select 'created'::text, p_inquiry_number, p_created_at;
end;
$$;

create or replace function public.change_inquiry_status(
  p_inquiry_id uuid,
  p_actor_user_id uuid,
  p_expected_revision integer,
  p_next_status public.inquiry_status,
  p_request_id uuid default null
)
returns table (
  outcome text,
  status public.inquiry_status,
  revision integer,
  updated_at timestamptz
)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  current_inquiry public.inquiries%rowtype;
  previous_inquiry_status public.inquiry_status;
  changed_at timestamptz := now();
begin
  perform 1
    from public.administrator_roles
   where auth_user_id = p_actor_user_id
     and role = 'administrator'
     and is_active;

  if not found then
    return query select 'forbidden'::text, null::public.inquiry_status, null::integer, null::timestamptz;
    return;
  end if;

  select *
    into current_inquiry
    from public.inquiries
   where id = p_inquiry_id
   for update;

  if not found then
    return query select 'not_found'::text, null::public.inquiry_status, null::integer, null::timestamptz;
    return;
  end if;

  if current_inquiry.revision <> p_expected_revision then
    return query
      select 'revision_conflict'::text, current_inquiry.status, current_inquiry.revision, current_inquiry.updated_at;
    return;
  end if;

  if current_inquiry.status = p_next_status then
    return query
      select 'same_status'::text, current_inquiry.status, current_inquiry.revision, current_inquiry.updated_at;
    return;
  end if;

  if not (
    (current_inquiry.status = 'received' and p_next_status = 'reviewing')
    or (current_inquiry.status = 'reviewing' and p_next_status = 'answered')
  ) then
    return query
      select 'invalid_transition'::text, current_inquiry.status, current_inquiry.revision, current_inquiry.updated_at;
    return;
  end if;

  previous_inquiry_status := current_inquiry.status;

  update public.inquiries
     set status = p_next_status,
         revision = current_inquiry.revision + 1,
         updated_at = changed_at
   where id = p_inquiry_id
   returning * into current_inquiry;

  insert into public.inquiry_events (
    inquiry_id,
    actor_type,
    actor_user_id,
    event_type,
    previous_status,
    next_status,
    created_at
  )
  values (
    current_inquiry.id,
    'administrator',
    p_actor_user_id,
    'status_changed',
    previous_inquiry_status,
    p_next_status,
    changed_at
  );

  insert into public.administrator_audit_logs (
    actor_user_id,
    action,
    target_type,
    target_id,
    previous_status,
    next_status,
    request_id,
    created_at
  )
  values (
    p_actor_user_id,
    'status_changed',
    'inquiry',
    current_inquiry.id,
    previous_inquiry_status,
    p_next_status,
    p_request_id,
    changed_at
  );

  return query
    select 'updated'::text, current_inquiry.status, current_inquiry.revision, current_inquiry.updated_at;
end;
$$;

-- Functions are callable only by the service role. The secret key granting
-- that role remains in the server environment and never reaches a browser.
revoke all on function public.create_inquiry(
  uuid, text, text, text, text, public.inquiry_category, text, text, text,
  text, text, timestamptz, timestamptz, timestamptz
) from public, anon, authenticated;

grant execute on function public.create_inquiry(
  uuid, text, text, text, text, public.inquiry_category, text, text, text,
  text, text, timestamptz, timestamptz, timestamptz
) to service_role;

revoke all on function public.change_inquiry_status(
  uuid, uuid, integer, public.inquiry_status, uuid
) from public, anon, authenticated;

grant execute on function public.change_inquiry_status(
  uuid, uuid, integer, public.inquiry_status, uuid
) to service_role;
