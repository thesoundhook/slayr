-- The send-whatsapp edge function (service_role) looks up a table's usher to
-- alert them on a new order. event_tables was never explicitly granted to
-- service_role, so that read could fail and the usher lookup silently returned
-- nothing. Grant the reads explicitly and reload the PostgREST schema cache.

grant select on table public.event_tables to service_role;
grant select on table public.event_ushers to service_role;

-- Refresh PostgREST's cached schema so the new grants/relationships are picked up.
notify pgrst, 'reload schema';
