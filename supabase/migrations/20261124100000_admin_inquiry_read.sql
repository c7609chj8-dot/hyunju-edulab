alter table public.inquiries
  add constraint inquiries_status_check
  check (status in ('new', 'in_progress', 'on_hold', 'completed', 'closed'));

create index inquiries_created_id_idx on public.inquiries (created_at desc, id desc);
create index inquiries_status_created_id_idx on public.inquiries (status, created_at desc, id desc);

grant select (
  id, inquiry_number, program_slug, inquiry_type, sender_name, sender_email,
  message, privacy_policy_version, privacy_consented_at, status, created_at
) on public.inquiries to authenticated;

create policy inquiry_admin_read on public.inquiries
  for select to authenticated
  using ((select membership_private.is_active_administrator()));
