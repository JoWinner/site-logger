do $$
begin
  if not exists (
    select 1
    from pg_proc
    where proname = 'import_employees'
      and prosecdef = false
  ) then
    raise exception 'import_employees must exist as security invoker';
  end if;

  if not exists (
    select 1
    from pg_proc
    where proname = 'import_sites'
      and prosecdef = false
  ) then
    raise exception 'import_sites must exist as security invoker';
  end if;

  if has_function_privilege('anon', 'public.import_employees(jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.import_sites(jsonb)', 'EXECUTE') then
    raise exception 'anon must not execute import functions';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.import_employees(jsonb)',
    'EXECUTE'
  ) or not has_function_privilege(
    'authenticated',
    'public.import_sites(jsonb)',
    'EXECUTE'
  ) then
    raise exception 'authenticated role must execute import functions';
  end if;
end
$$;

select 'master data import functions verified' as result;
