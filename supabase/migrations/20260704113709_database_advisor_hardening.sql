-- Remote migration version: 20260704113709.
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

create index if not exists attendance_corrections_corrected_by_idx
  on public.attendance_corrections (corrected_by);

create index if not exists attendance_events_qr_token_idx
  on public.attendance_events (qr_token_id);

create index if not exists attendance_sessions_check_in_by_idx
  on public.attendance_sessions (check_in_by);

create index if not exists attendance_sessions_check_out_by_idx
  on public.attendance_sessions (check_out_by);

create index if not exists employee_qr_tokens_issued_by_idx
  on public.employee_qr_tokens (issued_by);

create index if not exists employee_qr_tokens_revoked_by_idx
  on public.employee_qr_tokens (revoked_by);

create index if not exists employees_created_by_idx
  on public.employees (created_by);

create index if not exists employees_updated_by_idx
  on public.employees (updated_by);

create index if not exists sites_created_by_idx
  on public.sites (created_by);

create index if not exists sites_updated_by_idx
  on public.sites (updated_by);
