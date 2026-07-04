alter table public.attendance_events
  add column location_label text
    check (location_label is null or char_length(location_label) <= 500),
  add column location_feature_id text
    check (
      location_feature_id is null
      or char_length(location_feature_id) <= 300
    ),
  add column location_resolution_status text not null default 'unresolved'
    check (location_resolution_status in ('unresolved', 'resolved')),
  add column location_resolved_at timestamptz,
  add constraint attendance_event_location_resolution_complete check (
    (
      location_resolution_status = 'unresolved'
      and location_label is null
      and location_feature_id is null
      and location_resolved_at is null
    )
    or (
      location_resolution_status = 'resolved'
      and location_label is not null
      and location_resolved_at is not null
    )
  );

alter table public.attendance_sessions
  add column check_in_location_label text
    check (
      check_in_location_label is null
      or char_length(check_in_location_label) <= 500
    ),
  add column check_in_location_feature_id text
    check (
      check_in_location_feature_id is null
      or char_length(check_in_location_feature_id) <= 300
    ),
  add column check_in_location_resolution_status text not null
    default 'unresolved'
    check (check_in_location_resolution_status in ('unresolved', 'resolved')),
  add column check_in_location_resolved_at timestamptz,
  add column check_out_location_label text
    check (
      check_out_location_label is null
      or char_length(check_out_location_label) <= 500
    ),
  add column check_out_location_feature_id text
    check (
      check_out_location_feature_id is null
      or char_length(check_out_location_feature_id) <= 300
    ),
  add column check_out_location_resolution_status text
    check (
      check_out_location_resolution_status is null
      or check_out_location_resolution_status in ('unresolved', 'resolved')
    ),
  add column check_out_location_resolved_at timestamptz,
  add constraint attendance_session_check_in_location_complete check (
    (
      check_in_location_resolution_status = 'unresolved'
      and check_in_location_label is null
      and check_in_location_feature_id is null
      and check_in_location_resolved_at is null
    )
    or (
      check_in_location_resolution_status = 'resolved'
      and check_in_location_label is not null
      and check_in_location_resolved_at is not null
    )
  ),
  add constraint attendance_session_check_out_location_complete check (
    (
      check_out_event_id is null
      and check_out_location_resolution_status is null
      and check_out_location_label is null
      and check_out_location_feature_id is null
      and check_out_location_resolved_at is null
    )
    or (
      check_out_event_id is not null
      and check_out_location_resolution_status = 'unresolved'
      and check_out_location_label is null
      and check_out_location_feature_id is null
      and check_out_location_resolved_at is null
    )
    or (
      check_out_event_id is not null
      and check_out_location_resolution_status = 'resolved'
      and check_out_location_label is not null
      and check_out_location_resolved_at is not null
    )
  );

create or replace function private.mark_checkout_location_unresolved()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.check_out_event_id is null and new.check_out_event_id is not null then
    new.check_out_location_resolution_status := 'unresolved';
  end if;
  return new;
end
$$;

create trigger attendance_session_checkout_location_status
before update on public.attendance_sessions
for each row execute function private.mark_checkout_location_unresolved();

create or replace function private.prevent_attendance_event_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and (
      to_jsonb(new)
        - array[
          'location_label',
          'location_feature_id',
          'location_resolution_status',
          'location_resolved_at'
        ]
      =
      to_jsonb(old)
        - array[
          'location_label',
          'location_feature_id',
          'location_resolution_status',
          'location_resolved_at'
        ]
    )
    and old.location_resolution_status = 'unresolved'
    and old.location_label is null
    and old.location_feature_id is null
    and old.location_resolved_at is null
    and new.location_resolution_status = 'resolved'
    and new.location_label is not null
    and new.location_resolved_at is not null then
    return new;
  end if;

  raise exception 'attendance_events are immutable'
    using errcode = '55000';
end
$$;

drop policy profiles_select on public.profiles;
create policy profiles_select
on public.profiles
for select
to authenticated
using (
  private.is_active_app_user()
  and (
    id = (select auth.uid())
    or private.has_role(
      array['admin'::public.app_role, 'super_admin'::public.app_role]
    )
  )
);

create policy attendance_events_location_update
on public.attendance_events
for update
to authenticated
using (
  captured_by = (select auth.uid())
  and location_resolution_status = 'unresolved'
)
with check (captured_by = (select auth.uid()));

create policy attendance_sessions_location_update
on public.attendance_sessions
for update
to authenticated
using (
  check_in_by = (select auth.uid())
  or check_out_by = (select auth.uid())
)
with check (
  check_in_by = (select auth.uid())
  or check_out_by = (select auth.uid())
);

grant update (
  location_label,
  location_feature_id,
  location_resolution_status,
  location_resolved_at
) on public.attendance_events to authenticated;

grant update (
  check_in_location_label,
  check_in_location_feature_id,
  check_in_location_resolution_status,
  check_in_location_resolved_at,
  check_out_location_label,
  check_out_location_feature_id,
  check_out_location_resolution_status,
  check_out_location_resolved_at
) on public.attendance_sessions to authenticated;

create or replace function public.resolve_attendance_location(
  p_event_id uuid,
  p_location_label text,
  p_location_feature_id text,
  p_resolved_at timestamptz
)
returns public.attendance_sessions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.attendance_sessions%rowtype;
begin
  if p_location_label is null
    or char_length(btrim(p_location_label)) not between 1 and 500
    or (
      p_location_feature_id is not null
      and char_length(p_location_feature_id) > 300
    )
    or p_resolved_at is null then
    raise exception 'location metadata is invalid'
      using errcode = '22023';
  end if;

  update public.attendance_events
  set
    location_label = btrim(p_location_label),
    location_feature_id = nullif(btrim(p_location_feature_id), ''),
    location_resolution_status = 'resolved',
    location_resolved_at = p_resolved_at
  where id = p_event_id
    and captured_by = (select auth.uid())
    and location_resolution_status = 'unresolved';

  if not found then
    raise exception 'attendance event is unavailable for location resolution'
      using errcode = '42501';
  end if;

  update public.attendance_sessions
  set
    check_in_location_label = btrim(p_location_label),
    check_in_location_feature_id = nullif(btrim(p_location_feature_id), ''),
    check_in_location_resolution_status = 'resolved',
    check_in_location_resolved_at = p_resolved_at
  where check_in_event_id = p_event_id
  returning * into v_session;

  if not found then
    update public.attendance_sessions
    set
      check_out_location_label = btrim(p_location_label),
      check_out_location_feature_id = nullif(btrim(p_location_feature_id), ''),
      check_out_location_resolution_status = 'resolved',
      check_out_location_resolved_at = p_resolved_at
    where check_out_event_id = p_event_id
    returning * into v_session;
  end if;

  if v_session.id is null then
    raise exception 'attendance session was not found'
      using errcode = '23503';
  end if;

  return v_session;
end
$$;

revoke execute on function public.resolve_attendance_location(
  uuid,
  text,
  text,
  timestamptz
) from public, anon;
grant execute on function public.resolve_attendance_location(
  uuid,
  text,
  text,
  timestamptz
) to authenticated;
