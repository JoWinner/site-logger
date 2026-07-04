-- Remote migration version: 20260704112708.
create or replace function public.issue_bulk_qr_badges(
  p_employee_ids uuid[],
  p_token_hashes text[],
  p_actor_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer := cardinality(p_employee_ids);
begin
  if not exists (
    select 1
    from public.profiles
    where id = p_actor_id
      and role = 'super_admin'::public.app_role
      and is_active = true
  ) then
    raise exception 'active Super Admin required'
      using errcode = '42501';
  end if;

  if v_count is null
    or v_count not between 1 and 100
    or cardinality(p_token_hashes) <> v_count then
    raise exception 'badge arrays must contain 1 to 100 matching values'
      using errcode = '22023';
  end if;

  if (
    select count(distinct employee_id)
    from unnest(p_employee_ids) as employee_id
  ) <> v_count then
    raise exception 'employee IDs must be unique'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(p_token_hashes) as token_hash
    where token_hash !~ '^[0-9a-f]{64}$'
  ) then
    raise exception 'token hashes are invalid'
      using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.employees
    where id = any(p_employee_ids)
      and is_active = true
  ) <> v_count then
    raise exception 'every employee must exist and be active'
      using errcode = '23503';
  end if;

  update public.employee_qr_tokens
  set
    revoked_at = now(),
    revoked_by = p_actor_id
  where employee_id = any(p_employee_ids)
    and revoked_at is null;

  insert into public.employee_qr_tokens (
    employee_id,
    token_hash,
    issued_by
  )
  select
    p_employee_ids[array_index],
    p_token_hashes[array_index],
    p_actor_id
  from generate_subscripts(p_employee_ids, 1) as array_index;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    previous_values,
    new_values
  )
  select
    p_actor_id,
    'qr_issued',
    'employee_qr_tokens',
    employee_id::text,
    null,
    jsonb_build_object('employee_id', employee_id, 'bulk', true)
  from unnest(p_employee_ids) as employee_id;

  return jsonb_build_object('issued', v_count);
end
$$;

revoke execute on function public.issue_bulk_qr_badges(
  uuid[],
  text[],
  uuid
) from public, anon, authenticated;
grant execute on function public.issue_bulk_qr_badges(
  uuid[],
  text[],
  uuid
) to service_role;
