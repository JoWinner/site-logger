-- Remote migration version: 20260704113933.
alter function public.record_attendance_scan(
  text,
  uuid,
  public.attendance_action,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz,
  uuid
) set schema private;

alter function public.update_attendance_manual_fields(
  uuid,
  boolean,
  boolean,
  public.payroll_status,
  text
) set schema private;

alter function public.correct_attendance_session(
  uuid,
  timestamptz,
  timestamptz,
  text
) set schema private;

create function public.record_attendance_scan(
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
language sql
security invoker
set search_path = private, public, pg_temp
as $$
  select private.record_attendance_scan(
    p_raw_token,
    p_site_id,
    p_action,
    p_device_captured_at,
    p_latitude,
    p_longitude,
    p_accuracy_metres,
    p_location_captured_at,
    p_idempotency_key
  )
$$;

create function public.update_attendance_manual_fields(
  p_session_id uuid,
  p_overtime_check boolean,
  p_assignment_check boolean,
  p_payroll_status public.payroll_status,
  p_notes text
)
returns public.attendance_sessions
language sql
security invoker
set search_path = private, public, pg_temp
as $$
  select private.update_attendance_manual_fields(
    p_session_id,
    p_overtime_check,
    p_assignment_check,
    p_payroll_status,
    p_notes
  )
$$;

create function public.correct_attendance_session(
  p_session_id uuid,
  p_check_in_at timestamptz,
  p_check_out_at timestamptz,
  p_reason text
)
returns public.attendance_sessions
language sql
security invoker
set search_path = private, public, pg_temp
as $$
  select private.correct_attendance_session(
    p_session_id,
    p_check_in_at,
    p_check_out_at,
    p_reason
  )
$$;

revoke execute on function private.record_attendance_scan(
  text,
  uuid,
  public.attendance_action,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz,
  uuid
) from public, anon;

revoke execute on function private.update_attendance_manual_fields(
  uuid,
  boolean,
  boolean,
  public.payroll_status,
  text
) from public, anon;

revoke execute on function private.correct_attendance_session(
  uuid,
  timestamptz,
  timestamptz,
  text
) from public, anon;

grant execute on function private.record_attendance_scan(
  text,
  uuid,
  public.attendance_action,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz,
  uuid
) to authenticated;

grant execute on function private.update_attendance_manual_fields(
  uuid,
  boolean,
  boolean,
  public.payroll_status,
  text
) to authenticated;

grant execute on function private.correct_attendance_session(
  uuid,
  timestamptz,
  timestamptz,
  text
) to authenticated;

revoke execute on function public.record_attendance_scan(
  text,
  uuid,
  public.attendance_action,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz,
  uuid
) from public, anon;

revoke execute on function public.update_attendance_manual_fields(
  uuid,
  boolean,
  boolean,
  public.payroll_status,
  text
) from public, anon;

revoke execute on function public.correct_attendance_session(
  uuid,
  timestamptz,
  timestamptz,
  text
) from public, anon;

grant execute on function public.record_attendance_scan(
  text,
  uuid,
  public.attendance_action,
  timestamptz,
  numeric,
  numeric,
  numeric,
  timestamptz,
  uuid
) to authenticated;

grant execute on function public.update_attendance_manual_fields(
  uuid,
  boolean,
  boolean,
  public.payroll_status,
  text
) to authenticated;

grant execute on function public.correct_attendance_session(
  uuid,
  timestamptz,
  timestamptz,
  text
) to authenticated;
