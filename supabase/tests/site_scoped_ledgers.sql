do $$
declare
  v_scan_args text;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'assigned_site_id'
  ) then
    raise exception 'profiles.assigned_site_id is missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employees'
      and column_name = 'current_site_id'
  ) then
    raise exception 'employees.current_site_id is missing';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employees'
      and column_name = 'crew'
  ) then
    raise exception 'employees.crew must be removed';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('attendance_events', 'attendance_sessions')
      and (
        column_name like '%location_label%'
        or column_name like '%location_feature_id%'
        or column_name like '%location_resolution_status%'
        or column_name like '%location_resolved_at%'
      )
  ) then
    raise exception 'Mapbox location metadata columns must be removed';
  end if;

  if to_regprocedure(
    'public.resolve_attendance_location(uuid,text,text,timestamptz)'
  ) is not null then
    raise exception 'Mapbox location resolver must be removed';
  end if;

  select pg_get_function_identity_arguments(p.oid)
  into v_scan_args
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'record_attendance_scan';

  if v_scan_args like '%p_site_id%' then
    raise exception 'scan function must not accept a client-controlled site';
  end if;

  if not exists (
    select 1
    from public.profiles p
    join public.sites s on s.id = p.assigned_site_id
    where p.role = 'timekeeper'
      and (
        lower(p.username) = 'frank'
        or lower(p.display_name) = 'frank'
      )
      and s.site_code = 'ATLAS'
  ) then
    raise exception 'Frank must be assigned to Atlas';
  end if;
end
$$;

select 'site-scoped ledger schema verified' as result;
