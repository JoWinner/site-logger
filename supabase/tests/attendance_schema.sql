do $$
declare
  v_missing text[];
begin
  select array_agg(expected_name)
  into v_missing
  from (
    values
      ('profiles'),
      ('employees'),
      ('sites'),
      ('employee_qr_tokens'),
      ('attendance_events'),
      ('attendance_sessions'),
      ('attendance_corrections'),
      ('audit_logs')
  ) as expected(expected_name)
  where to_regclass('public.' || expected_name) is null;

  if v_missing is not null then
    raise exception 'Missing attendance tables: %', array_to_string(v_missing, ', ');
  end if;

  if (
    select is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employees'
      and column_name = 'employee_id_pin'
  ) <> 'YES' then
    raise exception 'employees.employee_id_pin must be nullable';
  end if;

  if not exists (
    select 1
    from pg_proc
    where proname = 'record_attendance_scan'
      and prosecdef = true
  ) then
    raise exception 'record_attendance_scan must exist and be security definer';
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'profiles',
        'employees',
        'sites',
        'employee_qr_tokens',
        'attendance_events',
        'attendance_sessions',
        'attendance_corrections',
        'audit_logs'
      )
      and c.relrowsecurity = false
  ) then
    raise exception 'Every public application table must have RLS enabled';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'attendance_events_immutable'
      and not tgisinternal
  ) then
    raise exception 'attendance event immutability trigger is missing';
  end if;
end
$$;

select
  'attendance schema verified' as result,
  count(*) filter (where schemaname = 'public') as public_policy_count
from pg_policies;
