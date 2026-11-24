create table public.inquiries (
  id uuid primary key,
  inquiry_number text not null unique check (inquiry_number ~ '^HJ-[A-HJ-NP-Z2-9]{12}$'),
  idempotency_key_hash text not null unique check (idempotency_key_hash ~ '^[0-9a-f]{64}$'),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  program_slug text,
  inquiry_type text not null check (inquiry_type in ('lecture','materials','ai','website','automation','other')),
  sender_name text not null check (char_length(sender_name) between 1 and 80),
  sender_email text not null check (char_length(sender_email) between 1 and 254),
  message text not null check (char_length(message) between 1 and 2000),
  privacy_policy_version text not null check (char_length(privacy_policy_version) between 1 and 64),
  privacy_consented_at timestamptz not null,
  status text not null default 'new',
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  retention_due_at timestamptz not null check (retention_due_at > created_at)
);

create table public.inquiry_events (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  actor_type text not null check (actor_type in ('system','administrator')),
  actor_user_id uuid,
  event_type text not null,
  previous_status text,
  next_status text,
  created_at timestamptz not null
);
create index inquiry_events_inquiry_created_idx on public.inquiry_events (inquiry_id, created_at desc);

create table public.inquiry_notification_attempts (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  delivery_key text not null unique,
  notification_type text not null check (notification_type = 'new_inquiry'),
  provider text not null check (provider ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  status text not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  created_at timestamptz not null
);
create index inquiry_notification_attempts_inquiry_idx on public.inquiry_notification_attempts (inquiry_id);

alter table public.inquiry_notification_attempts enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_events enable row level security;
revoke all on public.inquiries, public.inquiry_events, public.inquiry_notification_attempts from public, anon, authenticated, service_role;
grant select, insert on public.inquiries to service_role;
grant insert on public.inquiry_events, public.inquiry_notification_attempts to service_role;

create function public.save_new_inquiry(submission jsonb, notification_provider text default null)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved public.inquiries%rowtype;
begin
  insert into public.inquiries (
    id, inquiry_number, idempotency_key_hash, request_fingerprint, program_slug, inquiry_type,
    sender_name, sender_email, message, privacy_policy_version, privacy_consented_at,
    created_at, updated_at, retention_due_at
  ) values (
    (submission->>'id')::uuid, submission->>'inquiryNumber',
    submission->>'idempotencyKeyHash', submission->>'requestFingerprint',
    submission->>'programSlug', submission->>'inquiryType',
    submission->>'senderName', submission->>'senderEmail', submission->>'message',
    submission->>'privacyPolicyVersion', (submission->>'privacyConsentedAt')::timestamptz,
    (submission->>'createdAt')::timestamptz, (submission->>'updatedAt')::timestamptz,
    (submission->>'retentionDueAt')::timestamptz
  )
  on conflict (idempotency_key_hash) do nothing
  returning * into saved;

  if found then
    insert into public.inquiry_events (inquiry_id, actor_type, event_type, next_status, created_at)
    values (saved.id, 'system', 'submitted', saved.status, saved.created_at);

    if notification_provider is not null then
      insert into public.inquiry_notification_attempts
        (inquiry_id, delivery_key, notification_type, provider, created_at)
      values (saved.id, 'new_inquiry:' || saved.id, 'new_inquiry', notification_provider, saved.created_at);
    end if;

    return jsonb_build_object('outcome', 'created', 'inquiryNumber', saved.inquiry_number, 'createdAt', saved.created_at);
  end if;

  -- A separate statement sees the committed row even when the insert waited for another request.
  select * into strict saved
  from public.inquiries
  where idempotency_key_hash = submission->>'idempotencyKeyHash';

  if saved.request_fingerprint is distinct from submission->>'requestFingerprint' then
    return jsonb_build_object('outcome', 'idempotency_conflict');
  end if;

  return jsonb_build_object('outcome', 'replayed', 'inquiryNumber', saved.inquiry_number, 'createdAt', saved.created_at);
end;
$$;

revoke all on function public.save_new_inquiry(jsonb, text) from public, anon, authenticated;
grant execute on function public.save_new_inquiry(jsonb, text) to service_role;
