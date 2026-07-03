create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

create type public.app_role as enum ('timekeeper', 'admin', 'super_admin');
create type public.attendance_action as enum ('check_in', 'check_out');
create type public.attendance_status as enum ('open', 'complete', 'incomplete', 'corrected');
create type public.payroll_status as enum ('pending', 'approved', 'on_hold', 'paid');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique,
  display_name text not null check (char_length(trim(display_name)) between 1 and 120),
  role public.app_role not null default 'timekeeper',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_id_pin text,
  full_name text not null check (char_length(trim(full_name)) between 1 and 160),
  trade_role text,
  crew text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_id_pin_not_blank check (
    employee_id_pin is null or char_length(trim(employee_id_pin)) > 0
  )
);

create unique index employees_employee_id_pin_unique
  on public.employees (lower(employee_id_pin))
  where employee_id_pin is not null;

create index employees_active_name_idx
  on public.employees (is_active, lower(full_name));

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  site_code text not null unique check (char_length(trim(site_code)) between 2 and 40),
  name text not null check (char_length(trim(name)) between 1 and 180),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sites_active_name_idx
  on public.sites (is_active, lower(name));

create table public.employee_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  issued_at timestamptz not null default now(),
  issued_by uuid references public.profiles(id),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint qr_revocation_pair check (
    (revoked_at is null and revoked_by is null)
    or (revoked_at is not null and revoked_by is not null)
  )
);

create unique index employee_one_active_qr_idx
  on public.employee_qr_tokens (employee_id)
  where revoked_at is null;

create table public.attendance_events (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null unique,
  employee_id uuid not null references public.employees(id) on delete restrict,
  site_id uuid not null references public.sites(id) on delete restrict,
  action public.attendance_action not null,
  captured_by uuid not null references public.profiles(id) on delete restrict,
  device_captured_at timestamptz not null,
  server_received_at timestamptz not null default now(),
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  accuracy_metres numeric(10, 2) not null check (accuracy_metres > 0),
  location_captured_at timestamptz not null,
  qr_token_id uuid not null references public.employee_qr_tokens(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index attendance_events_employee_time_idx
  on public.attendance_events (employee_id, server_received_at desc);
create index attendance_events_site_time_idx
  on public.attendance_events (site_id, server_received_at desc);
create index attendance_events_captured_by_idx
  on public.attendance_events (captured_by, server_received_at desc);

create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  site_id uuid not null references public.sites(id) on delete restrict,
  work_date date not null,
  employee_name_snapshot text not null,
  employee_id_pin_snapshot text,
  site_name_snapshot text not null,
  site_code_snapshot text not null,
  check_in_event_id uuid not null unique references public.attendance_events(id) on delete restrict,
  check_out_event_id uuid unique references public.attendance_events(id) on delete restrict,
  check_in_at timestamptz not null,
  check_out_at timestamptz,
  check_in_latitude numeric(9, 6) not null,
  check_in_longitude numeric(9, 6) not null,
  check_in_accuracy_metres numeric(10, 2) not null,
  check_out_latitude numeric(9, 6),
  check_out_longitude numeric(9, 6),
  check_out_accuracy_metres numeric(10, 2),
  check_in_by uuid not null references public.profiles(id) on delete restrict,
  check_out_by uuid references public.profiles(id) on delete restrict,
  worked_minutes integer check (worked_minutes is null or worked_minutes >= 0),
  overtime_check boolean,
  assignment_check boolean,
  payroll_status public.payroll_status,
  notes text check (notes is null or char_length(notes) <= 1000),
  status public.attendance_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_checkout_fields_together check (
    (
      check_out_event_id is null
      and check_out_at is null
      and check_out_latitude is null
      and check_out_longitude is null
      and check_out_accuracy_metres is null
      and check_out_by is null
      and worked_minutes is null
    )
    or (
      check_out_event_id is not null
      and check_out_at is not null
      and check_out_latitude is not null
      and check_out_longitude is not null
      and check_out_accuracy_metres is not null
      and check_out_by is not null
      and worked_minutes is not null
    )
  )
);

create unique index attendance_one_open_session_per_employee_idx
  on public.attendance_sessions (employee_id)
  where check_out_event_id is null;
create index attendance_sessions_work_date_idx
  on public.attendance_sessions (work_date desc);
create index attendance_sessions_site_date_idx
  on public.attendance_sessions (site_id, work_date desc);
create index attendance_sessions_employee_date_idx
  on public.attendance_sessions (employee_id, work_date desc);

create table public.attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete restrict,
  previous_values jsonb not null,
  corrected_values jsonb not null,
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  corrected_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index attendance_corrections_session_idx
  on public.attendance_corrections (attendance_session_id, created_at desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  previous_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx
  on public.audit_logs (actor_id, created_at desc);

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
    and is_active = true
$$;

create or replace function private.is_active_app_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_active = true
  )
$$;

create or replace function private.has_role(allowed_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(private.current_app_role() = any(allowed_roles), false)
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger employees_set_updated_at
before update on public.employees
for each row execute function private.set_updated_at();

create trigger sites_set_updated_at
before update on public.sites
for each row execute function private.set_updated_at();

create trigger attendance_sessions_set_updated_at
before update on public.attendance_sessions
for each row execute function private.set_updated_at();

create or replace function private.audit_master_data_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_entity_id text;
begin
  v_entity_id := coalesce(new.id, old.id)::text;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    previous_values,
    new_values
  )
  values (
    v_actor,
    lower(tg_op),
    tg_table_name,
    v_entity_id,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );

  return coalesce(new, old);
end
$$;

create trigger employees_audit_change
after insert or update on public.employees
for each row execute function private.audit_master_data_change();

create trigger sites_audit_change
after insert or update on public.sites
for each row execute function private.audit_master_data_change();

create or replace function private.prevent_attendance_event_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'attendance_events are immutable'
    using errcode = '55000';
end
$$;

create trigger attendance_events_immutable
before update or delete on public.attendance_events
for each row execute function private.prevent_attendance_event_mutation();

create or replace function public.record_attendance_scan(
  p_raw_token text,
  p_site_id uuid,
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
  v_employee public.employees%rowtype;
  v_site public.sites%rowtype;
  v_qr public.employee_qr_tokens%rowtype;
  v_event public.attendance_events%rowtype;
  v_session public.attendance_sessions%rowtype;
  v_token_hash text;
begin
  if v_actor is null or not private.is_active_app_user() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
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
      'ok', false,
      'code', 'duplicate_request',
      'event_id', v_event.id
    );
  end if;

  select *
  into v_site
  from public.sites
  where id = p_site_id
    and is_active = true;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'inactive_site');
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

  select *
  into v_session
  from public.attendance_sessions
  where employee_id = v_employee.id
    and check_out_event_id is null
  order by check_in_at desc
  limit 1
  for update;

  if p_action = 'check_in' and found then
    return jsonb_build_object(
      'ok', false,
      'code', 'already_checked_in',
      'session_id', v_session.id
    );
  end if;

  if p_action = 'check_out' and not found then
    return jsonb_build_object('ok', false, 'code', 'no_open_session');
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
        floor(extract(epoch from (p_device_captured_at - check_in_at)) / 60)::integer
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

create or replace function public.update_attendance_manual_fields(
  p_session_id uuid,
  p_overtime_check boolean,
  p_assignment_check boolean,
  p_payroll_status public.payroll_status,
  p_notes text
)
returns public.attendance_sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_previous public.attendance_sessions%rowtype;
  v_updated public.attendance_sessions%rowtype;
  v_is_admin boolean;
begin
  if v_actor is null or not private.is_active_app_user() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role])
  into v_is_admin;

  select *
  into v_previous
  from public.attendance_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'attendance session not found' using errcode = 'P0002';
  end if;

  if not v_is_admin
    and v_previous.check_in_by <> v_actor
    and coalesce(v_previous.check_out_by, v_previous.check_in_by) <> v_actor then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_notes is not null and char_length(p_notes) > 1000 then
    raise exception 'notes exceed 1000 characters' using errcode = '22001';
  end if;

  update public.attendance_sessions
  set
    overtime_check = p_overtime_check,
    assignment_check = p_assignment_check,
    payroll_status = p_payroll_status,
    notes = nullif(trim(p_notes), '')
  where id = p_session_id
  returning * into v_updated;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    previous_values,
    new_values
  )
  values (
    v_actor,
    'manual_fields_updated',
    'attendance_sessions',
    p_session_id::text,
    jsonb_build_object(
      'overtime_check', v_previous.overtime_check,
      'assignment_check', v_previous.assignment_check,
      'payroll_status', v_previous.payroll_status,
      'notes', v_previous.notes
    ),
    jsonb_build_object(
      'overtime_check', v_updated.overtime_check,
      'assignment_check', v_updated.assignment_check,
      'payroll_status', v_updated.payroll_status,
      'notes', v_updated.notes
    )
  );

  return v_updated;
end
$$;

create or replace function public.correct_attendance_session(
  p_session_id uuid,
  p_check_in_at timestamptz,
  p_check_out_at timestamptz,
  p_reason text
)
returns public.attendance_sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_previous public.attendance_sessions%rowtype;
  v_updated public.attendance_sessions%rowtype;
begin
  if v_actor is null
    or not private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role]) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_check_in_at is null
    or p_reason is null
    or char_length(trim(p_reason)) < 3
    or char_length(trim(p_reason)) > 500
    or (p_check_out_at is not null and p_check_out_at < p_check_in_at) then
    raise exception 'invalid correction' using errcode = '22023';
  end if;

  select *
  into v_previous
  from public.attendance_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'attendance session not found' using errcode = 'P0002';
  end if;

  if (v_previous.check_out_event_id is null) <> (p_check_out_at is null) then
    raise exception 'corrections cannot add or remove scan evidence'
      using errcode = '22023';
  end if;

  update public.attendance_sessions
  set
    check_in_at = p_check_in_at,
    check_out_at = p_check_out_at,
    worked_minutes = case
      when p_check_out_at is null then null
      else floor(extract(epoch from (p_check_out_at - p_check_in_at)) / 60)::integer
    end,
    status = 'corrected'
  where id = p_session_id
  returning * into v_updated;

  insert into public.attendance_corrections (
    attendance_session_id,
    previous_values,
    corrected_values,
    reason,
    corrected_by
  )
  values (
    p_session_id,
    jsonb_build_object(
      'check_in_at', v_previous.check_in_at,
      'check_out_at', v_previous.check_out_at,
      'worked_minutes', v_previous.worked_minutes,
      'status', v_previous.status
    ),
    jsonb_build_object(
      'check_in_at', v_updated.check_in_at,
      'check_out_at', v_updated.check_out_at,
      'worked_minutes', v_updated.worked_minutes,
      'status', v_updated.status
    ),
    trim(p_reason),
    v_actor
  );

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    previous_values,
    new_values
  )
  values (
    v_actor,
    'attendance_corrected',
    'attendance_sessions',
    p_session_id::text,
    to_jsonb(v_previous),
    to_jsonb(v_updated)
  );

  return v_updated;
end
$$;

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.sites enable row level security;
alter table public.employee_qr_tokens enable row level security;
alter table public.attendance_events enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_corrections enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select
on public.profiles
for select
to authenticated
using (
  private.is_active_app_user()
  and (
    id = (select auth.uid())
    or private.has_role(array['super_admin'::public.app_role])
  )
);

create policy employees_select
on public.employees
for select
to authenticated
using (private.is_active_app_user());

create policy employees_insert
on public.employees
for insert
to authenticated
with check (
  private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role])
);

create policy employees_update
on public.employees
for update
to authenticated
using (
  private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role])
)
with check (
  private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role])
);

create policy sites_select
on public.sites
for select
to authenticated
using (private.is_active_app_user());

create policy sites_insert
on public.sites
for insert
to authenticated
with check (
  private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role])
);

create policy sites_update
on public.sites
for update
to authenticated
using (
  private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role])
)
with check (
  private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role])
);

create policy qr_tokens_admin_select
on public.employee_qr_tokens
for select
to authenticated
using (
  private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role])
);

create policy attendance_events_select
on public.attendance_events
for select
to authenticated
using (
  captured_by = (select auth.uid())
  or private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role])
);

create policy attendance_sessions_select
on public.attendance_sessions
for select
to authenticated
using (
  check_in_by = (select auth.uid())
  or check_out_by = (select auth.uid())
  or private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role])
);

create policy attendance_corrections_admin_select
on public.attendance_corrections
for select
to authenticated
using (
  private.has_role(array['admin'::public.app_role, 'super_admin'::public.app_role])
);

create policy audit_logs_super_admin_select
on public.audit_logs
for select
to authenticated
using (
  private.has_role(array['super_admin'::public.app_role])
);

revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from public;

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;
grant select on public.profiles, public.employees, public.sites,
  public.employee_qr_tokens, public.attendance_events,
  public.attendance_sessions, public.attendance_corrections,
  public.audit_logs to authenticated;
grant insert, update on public.employees, public.sites to authenticated;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.is_active_app_user() to authenticated;
grant execute on function private.has_role(public.app_role[]) to authenticated;
grant execute on function public.record_attendance_scan(
  text, uuid, public.attendance_action, timestamptz,
  numeric, numeric, numeric, timestamptz, uuid
) to authenticated;
grant execute on function public.update_attendance_manual_fields(
  uuid, boolean, boolean, public.payroll_status, text
) to authenticated;
grant execute on function public.correct_attendance_session(
  uuid, timestamptz, timestamptz, text
) to authenticated;
