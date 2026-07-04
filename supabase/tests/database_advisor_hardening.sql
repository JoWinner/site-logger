do $$
begin
  if has_function_privilege(
    'anon',
    'public.record_attendance_scan(text,uuid,public.attendance_action,timestamptz,numeric,numeric,numeric,timestamptz,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.update_attendance_manual_fields(uuid,boolean,boolean,public.payroll_status,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.correct_attendance_session(uuid,timestamptz,timestamptz,text)',
    'EXECUTE'
  ) then
    raise exception 'anon must not execute protected attendance functions';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.record_attendance_scan(text,uuid,public.attendance_action,timestamptz,numeric,numeric,numeric,timestamptz,uuid)',
    'EXECUTE'
  ) then
    raise exception 'authenticated users must execute attendance scan function';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'record_attendance_scan',
        'update_attendance_manual_fields',
        'correct_attendance_session'
      )
      and p.prosecdef
  ) then
    raise exception 'public attendance mutation wrappers must be security invoker';
  end if;
end
$$;

select 'database advisor hardening verified' as result;
