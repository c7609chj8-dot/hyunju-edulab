grant select (revision) on public.inquiries to authenticated;
grant select (id, inquiry_id, actor_user_id, event_type, previous_status, next_status, created_at)
  on public.inquiry_events to authenticated;

create policy inquiry_admin_read_status_history on public.inquiry_events
  for select to authenticated
  using (event_type = 'status_changed' and (select membership_private.is_active_administrator()));

create function membership_private.change_inquiry_status(
  inquiry_id uuid,
  expected_revision integer,
  expected_status text,
  next_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  changed_at timestamptz;
begin
  if actor_id is null or not membership_private.is_active_administrator() then
    raise exception 'Active administrator required' using errcode = '42501';
  end if;

  if not coalesce(
    case expected_status
      when 'new' then next_status in ('in_progress', 'on_hold', 'completed', 'closed')
      when 'in_progress' then next_status in ('on_hold', 'completed', 'closed')
      when 'on_hold' then next_status in ('in_progress', 'completed', 'closed')
      else false
    end, false
  ) then
    return false;
  end if;

  update public.inquiries as inquiry
  set status = change_inquiry_status.next_status,
      revision = inquiry.revision + 1,
      updated_at = clock_timestamp()
  where inquiry.id = change_inquiry_status.inquiry_id
    and inquiry.revision = expected_revision
    and inquiry.status = expected_status
    and inquiry.revision < 2147483647
  returning inquiry.updated_at into changed_at;

  if not found then return false; end if;

  insert into public.inquiry_events
    (inquiry_id, actor_type, actor_user_id, event_type, previous_status, next_status, created_at)
  values (
    change_inquiry_status.inquiry_id, 'administrator', actor_id, 'status_changed',
    expected_status, change_inquiry_status.next_status, changed_at
  );
  return true;
end;
$$;

create function public.change_inquiry_status(
  inquiry_id uuid,
  expected_revision integer,
  expected_status text,
  next_status text
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select membership_private.change_inquiry_status($1, $2, $3, $4);
$$;

revoke all on function membership_private.change_inquiry_status(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.change_inquiry_status(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function membership_private.change_inquiry_status(uuid, integer, text, text) to authenticated;
grant execute on function public.change_inquiry_status(uuid, integer, text, text) to authenticated;
