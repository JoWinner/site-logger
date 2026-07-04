do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'attendance_events'
      and column_name = 'location_label'
  ) then
    raise exception 'attendance event location label is missing';
  end if;

  if not exists (
    select 1
    from pg_proc
    where proname = 'resolve_attendance_location'
      and prosecdef = false
  ) then
    raise exception 'location resolver must be security invoker';
  end if;

  if has_function_privilege(
    'anon',
    'public.resolve_attendance_location(uuid,text,text,timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'anon must not resolve attendance locations';
  end if;
end
$$;

select 'attendance location schema verified' as result;
