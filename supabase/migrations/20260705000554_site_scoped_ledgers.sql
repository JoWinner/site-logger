alter table public.profiles
  add column assigned_site_id uuid references public.sites(id) on delete restrict;

alter table public.employees
  add column current_site_id uuid references public.sites(id) on delete set null;

create index profiles_assigned_site_idx
  on public.profiles (assigned_site_id);

create index employees_current_site_idx
  on public.employees (current_site_id);

update public.profiles p
set assigned_site_id = s.id
from public.sites s
where p.role = 'timekeeper'
  and (
    lower(p.username) = 'frank'
    or lower(p.display_name) = 'frank'
  )
  and s.site_code = 'ATLAS';

update public.employees e
set current_site_id = s.id
from public.sites s
where e.full_name in ('Andre Cole', 'Luis Rivera')
  and s.site_code = 'ATLAS';

alter table public.profiles
  add constraint profiles_timekeeper_site_assignment check (
    (
      role = 'timekeeper'
      and assigned_site_id is not null
    )
    or (
      role <> 'timekeeper'
      and assigned_site_id is null
    )
  );

revoke update (
  location_label,
  location_feature_id,
  location_resolution_status,
  location_resolved_at
) on public.attendance_events from authenticated;

revoke update (
  check_in_location_label,
  check_in_location_feature_id,
  check_in_location_resolution_status,
  check_in_location_resolved_at,
  check_out_location_label,
  check_out_location_feature_id,
  check_out_location_resolution_status,
  check_out_location_resolved_at
) on public.attendance_sessions from authenticated;

drop policy if exists attendance_events_location_update
  on public.attendance_events;
drop policy if exists attendance_sessions_location_update
  on public.attendance_sessions;

drop function if exists public.resolve_attendance_location(
  uuid,
  text,
  text,
  timestamptz
);

drop trigger if exists attendance_session_checkout_location_status
  on public.attendance_sessions;
drop function if exists private.mark_checkout_location_unresolved();

alter table public.attendance_events
  drop column location_label,
  drop column location_feature_id,
  drop column location_resolution_status,
  drop column location_resolved_at;

alter table public.attendance_sessions
  drop column check_in_location_label,
  drop column check_in_location_feature_id,
  drop column check_in_location_resolution_status,
  drop column check_in_location_resolved_at,
  drop column check_out_location_label,
  drop column check_out_location_feature_id,
  drop column check_out_location_resolution_status,
  drop column check_out_location_resolved_at;

alter table public.employees drop column crew;

create or replace function public.import_employees(p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_row jsonb;
  v_id uuid;
  v_full_name text;
  v_employee_id_pin text;
  v_trade_role text;
  v_current_site_id uuid;
  v_is_active boolean;
  v_created integer := 0;
  v_updated integer := 0;
begin
  if not private.has_role(
    array['admin'::public.app_role, 'super_admin'::public.app_role]
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if jsonb_typeof(p_rows) <> 'array'
    or jsonb_array_length(p_rows) = 0
    or jsonb_array_length(p_rows) > 2000 then
    raise exception 'employee import must contain 1 to 2000 rows'
      using errcode = '22023';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_full_name := nullif(btrim(v_row ->> 'fullName'), '');
    v_employee_id_pin := nullif(
      upper(btrim(v_row ->> 'employeeIdPin')),
      ''
    );
    v_trade_role := nullif(btrim(v_row ->> 'tradeRole'), '');
    v_current_site_id := nullif(v_row ->> 'currentSiteId', '')::uuid;

    if jsonb_typeof(v_row -> 'isActive') not in ('boolean', 'null') then
      raise exception 'employee isActive must be a boolean'
        using errcode = '22023';
    end if;
    v_is_active := coalesce((v_row ->> 'isActive')::boolean, true);

    if v_full_name is null or char_length(v_full_name) > 160
      or (
        v_employee_id_pin is not null
        and char_length(v_employee_id_pin) > 80
      )
      or (
        v_trade_role is not null
        and char_length(v_trade_role) > 120
      ) then
      raise exception 'employee import row is invalid'
        using errcode = '22023';
    end if;

    if v_current_site_id is not null and not exists (
      select 1
      from public.sites
      where id = v_current_site_id
        and is_active = true
    ) then
      raise exception 'employee current site is unavailable'
        using errcode = '22023';
    end if;

    v_id := null;
    if v_employee_id_pin is not null then
      select employee.id
      into v_id
      from public.employees as employee
      where lower(employee.employee_id_pin) = lower(v_employee_id_pin)
      for update;
    end if;

    if v_id is null then
      insert into public.employees (
        full_name,
        employee_id_pin,
        trade_role,
        current_site_id,
        is_active,
        created_by,
        updated_by
      )
      values (
        v_full_name,
        v_employee_id_pin,
        v_trade_role,
        v_current_site_id,
        v_is_active,
        v_actor,
        v_actor
      );
      v_created := v_created + 1;
    else
      update public.employees
      set
        full_name = v_full_name,
        employee_id_pin = v_employee_id_pin,
        trade_role = v_trade_role,
        current_site_id = v_current_site_id,
        is_active = v_is_active,
        updated_by = v_actor
      where id = v_id;
      v_updated := v_updated + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'created', v_created,
    'updated', v_updated
  );
end
$$;

create or replace function private.prevent_attendance_event_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'attendance_events are immutable'
    using errcode = '55000';
end
$$;

drop function public.record_attendance_scan(
  text,
  uuid,
  public.attendance_action,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz,
  uuid
);

drop function private.record_attendance_scan(
  text,
  uuid,
  public.attendance_action,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz,
  uuid
);

create function private.record_attendance_scan(
  p_raw_token text,
  p_action public.attendance_action,
  p_device_captured_at timestamptz,
  p_latitude numeric,
  p_longitude numeric,
  p_accuracy_metres numeric,
  p_location_captured_at timestamptz,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_profile public.profiles%rowtype;
  v_employee public.employees%rowtype;
  v_site public.sites%rowtype;
  v_qr public.employee_qr_tokens%rowtype;
  v_event public.attendance_events%rowtype;
  v_session public.attendance_sessions%rowtype;
  v_token_hash text;
begin
  select *
  into v_profile
  from public.profiles
  where id = v_actor
    and is_active = true
    and role = 'timekeeper';

  if not found or v_profile.assigned_site_id is null then
    return jsonb_build_object(
      'ok', false, 'code', 'site_assignment_required'
    );
  end if;

  select *
  into v_site
  from public.sites
  where id = v_profile.assigned_site_id
    and is_active = true;

  if not found then
    return jsonb_build_object(
      'ok', false, 'code', 'site_assignment_required'
    );
  end if;

  if p_raw_token is null or char_length(p_raw_token) < 16 then
    return jsonb_build_object('ok', false, 'code', 'invalid_qr');
  end if;

  if p_latitude is null or p_latitude < -90 or p_latitude > 90
    or p_longitude is null or p_longitude < -180 or p_longitude > 180
    or p_accuracy_metres is null or p_accuracy_metres <= 0
    or p_location_captured_at is null
    or p_location_captured_at < now() - interval '10 minutes'
    or p_location_captured_at > now() + interval '1 minute' then
    return jsonb_build_object('ok', false, 'code', 'gps_required');
  end if;

  select *
  into v_event
  from public.attendance_events
  where idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object(
      'ok', false, 'code', 'duplicate_request', 'event_id', v_event.id
    );
  end if;

  v_token_hash := encode(digest(p_raw_token, 'sha256'), 'hex');

  select q.*
  into v_qr
  from public.employee_qr_tokens q
  where q.token_hash = v_token_hash
    and q.revoked_at is null;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'invalid_qr');
  end if;

  select *
  into v_employee
  from public.employees
  where id = v_qr.employee_id;

  if not found or not v_employee.is_active then
    return jsonb_build_object('ok', false, 'code', 'inactive_employee');
  end if;

  if p_action = 'check_in' then
    select *
    into v_session
    from public.attendance_sessions
    where employee_id = v_employee.id
      and check_out_event_id is null
    order by check_in_at desc
    limit 1
    for update;

    if found then
      return jsonb_build_object(
        'ok', false, 'code', 'already_checked_in',
        'session_id', v_session.id
      );
    end if;
  else
    select *
    into v_session
    from public.attendance_sessions
    where employee_id = v_employee.id
      and site_id = v_site.id
      and check_out_event_id is null
    order by check_in_at desc
    limit 1
    for update;

    if not found then
      return jsonb_build_object('ok', false, 'code', 'no_open_session');
    end if;
  end if;

  insert into public.attendance_events (
    idempotency_key,
    employee_id,
    site_id,
    action,
    captured_by,
    device_captured_at,
    latitude,
    longitude,
    accuracy_metres,
    location_captured_at,
    qr_token_id
  )
  values (
    p_idempotency_key,
    v_employee.id,
    v_site.id,
    p_action,
    v_actor,
    p_device_captured_at,
    p_latitude,
    p_longitude,
    p_accuracy_metres,
    p_location_captured_at,
    v_qr.id
  )
  returning * into v_event;

  if p_action = 'check_in' then
    insert into public.attendance_sessions (
      employee_id,
      site_id,
      work_date,
      employee_name_snapshot,
      employee_id_pin_snapshot,
      site_name_snapshot,
      site_code_snapshot,
      check_in_event_id,
      check_in_at,
      check_in_latitude,
      check_in_longitude,
      check_in_accuracy_metres,
      check_in_by,
      status
    )
    values (
      v_employee.id,
      v_site.id,
      (p_device_captured_at at time zone 'Atlantic/Reykjavik')::date,
      v_employee.full_name,
      v_employee.employee_id_pin,
      v_site.name,
      v_site.site_code,
      v_event.id,
      p_device_captured_at,
      p_latitude,
      p_longitude,
      p_accuracy_metres,
      v_actor,
      'open'
    )
    returning * into v_session;
  else
    update public.attendance_sessions
    set
      check_out_event_id = v_event.id,
      check_out_at = p_device_captured_at,
      check_out_latitude = p_latitude,
      check_out_longitude = p_longitude,
      check_out_accuracy_metres = p_accuracy_metres,
      check_out_by = v_actor,
      worked_minutes = greatest(
        0,
        floor(
          extract(epoch from (p_device_captured_at - check_in_at)) / 60
        )::integer
      ),
      status = 'complete'
    where id = v_session.id
    returning * into v_session;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'recorded',
    'event_id', v_event.id,
    'session_id', v_session.id,
    'employee_id', v_employee.id,
    'employee_name', v_employee.full_name,
    'site_name', v_site.name,
    'action', p_action,
    'captured_at', p_device_captured_at
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'duplicate_request');
end
$$;

create function public.record_attendance_scan(
  p_raw_token text,
  p_action public.attendance_action,
  p_device_captured_at timestamptz,
  p_latitude numeric,
  p_longitude numeric,
  p_accuracy_metres numeric,
  p_location_captured_at timestamptz,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = private, public, pg_temp
as $$
  select private.record_attendance_scan(
    p_raw_token,
    p_action,
    p_device_captured_at,
    p_latitude,
    p_longitude,
    p_accuracy_metres,
    p_location_captured_at,
    p_idempotency_key
  )
$$;

revoke execute on function private.record_attendance_scan(
  text,
  public.attendance_action,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz,
  uuid
) from public, anon;

grant execute on function private.record_attendance_scan(
  text,
  public.attendance_action,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz,
  uuid
) to authenticated;

revoke execute on function public.record_attendance_scan(
  text,
  public.attendance_action,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz,
  uuid
) from public, anon;

grant execute on function public.record_attendance_scan(
  text,
  public.attendance_action,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz,
  uuid
) to authenticated;

drop policy profiles_select on public.profiles;
create policy profiles_select
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or private.has_role(
    array['admin'::public.app_role, 'super_admin'::public.app_role]
  )
);

drop policy sites_select on public.sites;
create policy sites_select
on public.sites
for select
to authenticated
using (
  private.has_role(
    array['admin'::public.app_role, 'super_admin'::public.app_role]
  )
  or id = (
    select assigned_site_id
    from public.profiles
    where id = (select auth.uid())
      and role = 'timekeeper'
      and is_active = true
  )
);

drop policy attendance_events_select on public.attendance_events;
create policy attendance_events_select
on public.attendance_events
for select
to authenticated
using (
  private.has_role(
    array['admin'::public.app_role, 'super_admin'::public.app_role]
  )
  or (
    captured_by = (select auth.uid())
    and site_id = (
      select assigned_site_id
      from public.profiles
      where id = (select auth.uid())
        and role = 'timekeeper'
        and is_active = true
    )
  )
);

drop policy attendance_sessions_select on public.attendance_sessions;
create policy attendance_sessions_select
on public.attendance_sessions
for select
to authenticated
using (
  private.has_role(
    array['admin'::public.app_role, 'super_admin'::public.app_role]
  )
  or (
    (
      check_in_by = (select auth.uid())
      or check_out_by = (select auth.uid())
    )
    and site_id = (
      select assigned_site_id
      from public.profiles
      where id = (select auth.uid())
        and role = 'timekeeper'
        and is_active = true
    )
  )
);
