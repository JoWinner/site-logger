insert into public.employees (
  employee_id_pin,
  full_name,
  trade_role,
  is_active
)
select 'E001', 'Marcus Hill', 'Foreman', true
where not exists (
  select 1 from public.employees where lower(employee_id_pin) = lower('E001')
);

insert into public.employees (
  employee_id_pin,
  full_name,
  trade_role,
  is_active
)
select 'E002', 'Daniel Reyes', 'Carpenter', true
where not exists (
  select 1 from public.employees where lower(employee_id_pin) = lower('E002')
);

insert into public.employees (
  employee_id_pin,
  full_name,
  trade_role,
  is_active
)
select 'E003', 'Andre Cole', 'Electrician', true
where not exists (
  select 1 from public.employees where lower(employee_id_pin) = lower('E003')
);

insert into public.employees (
  employee_id_pin,
  full_name,
  trade_role,
  is_active
)
select null, 'Luis Rivera', 'Mason', true
where not exists (
  select 1
  from public.employees
  where employee_id_pin is null
    and lower(full_name) = lower('Luis Rivera')
);

insert into public.sites (site_code, name, is_active)
values
  ('ATLAS', 'Atlas', true),
  ('VARON-RISE', 'Varon Rise', true),
  ('THE-DUNES', 'The Dunes', true)
on conflict (site_code) do update
set name = excluded.name,
    is_active = excluded.is_active,
    updated_at = now();

update public.employees e
set current_site_id = s.id
from public.sites s
where e.full_name in ('Andre Cole', 'Luis Rivera')
  and s.site_code = 'ATLAS';
