-- Public lookup for a table's usher *name* (not phone) so the guest-facing menu
-- page can greet them with their usher. event_ushers is admin-only by RLS and
-- holds phone numbers, so we expose only the name via a SECURITY DEFINER function.

create or replace function public.get_table_usher(p_event_id uuid, p_table_number int)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.name
  from public.event_tables t
  join public.event_ushers u on u.id = t.usher_id
  where t.event_id = p_event_id
    and t.table_number = p_table_number
  limit 1
$$;

grant execute on function public.get_table_usher(uuid, int) to anon, authenticated;
