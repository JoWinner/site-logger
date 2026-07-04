do $$
begin
  if not exists (
    select 1
    from pg_proc
    where proname = 'issue_bulk_qr_badges'
      and prosecdef = false
  ) then
    raise exception 'bulk badge function must be security invoker';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.issue_bulk_qr_badges(uuid[],text[],uuid)',
    'EXECUTE'
  ) then
    raise exception 'authenticated users must not call the bulk badge function';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.issue_bulk_qr_badges(uuid[],text[],uuid)',
    'EXECUTE'
  ) then
    raise exception 'service role must call the bulk badge function';
  end if;
end
$$;

select 'bulk QR badge function verified' as result;
