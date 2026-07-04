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
  v_crew text;
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
    v_employee_id_pin := nullif(upper(btrim(v_row ->> 'employeeIdPin')), '');
    v_trade_role := nullif(btrim(v_row ->> 'tradeRole'), '');
    v_crew := nullif(btrim(v_row ->> 'crew'), '');

    if jsonb_typeof(v_row -> 'isActive') not in ('boolean', 'null') then
      raise exception 'employee isActive must be a boolean'
        using errcode = '22023';
    end if;
    v_is_active := coalesce((v_row ->> 'isActive')::boolean, true);

    if v_full_name is null or char_length(v_full_name) > 160
      or (v_employee_id_pin is not null and char_length(v_employee_id_pin) > 80)
      or (v_trade_role is not null and char_length(v_trade_role) > 120)
      or (v_crew is not null and char_length(v_crew) > 120) then
      raise exception 'employee import row is invalid'
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
        crew,
        is_active,
        created_by,
        updated_by
      )
      values (
        v_full_name,
        v_employee_id_pin,
        v_trade_role,
        v_crew,
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
        crew = v_crew,
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

create or replace function public.import_sites(p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_row jsonb;
  v_id uuid;
  v_site_code text;
  v_name text;
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
    raise exception 'site import must contain 1 to 2000 rows'
      using errcode = '22023';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_site_code := nullif(upper(btrim(v_row ->> 'siteCode')), '');
    v_name := nullif(btrim(v_row ->> 'name'), '');

    if jsonb_typeof(v_row -> 'isActive') not in ('boolean', 'null') then
      raise exception 'site isActive must be a boolean'
        using errcode = '22023';
    end if;
    v_is_active := coalesce((v_row ->> 'isActive')::boolean, true);

    if v_site_code is null
      or v_site_code !~ '^[A-Z0-9_-]+$'
      or char_length(v_site_code) not between 2 and 40
      or v_name is null
      or char_length(v_name) > 180 then
      raise exception 'site import row is invalid'
        using errcode = '22023';
    end if;

    select site.id
    into v_id
    from public.sites as site
    where lower(site.site_code) = lower(v_site_code)
    for update;

    if v_id is null then
      insert into public.sites (
        site_code,
        name,
        is_active,
        created_by,
        updated_by
      )
      values (
        v_site_code,
        v_name,
        v_is_active,
        v_actor,
        v_actor
      );
      v_created := v_created + 1;
    else
      update public.sites
      set
        name = v_name,
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

revoke execute on function public.import_employees(jsonb) from public, anon;
revoke execute on function public.import_sites(jsonb) from public, anon;
grant execute on function public.import_employees(jsonb) to authenticated;
grant execute on function public.import_sites(jsonb) to authenticated;
