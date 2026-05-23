-- ============================================================
-- Admin access to tickets / orders / order_items
--
-- Background: admin portal (authenticated role) was hitting
-- "permission denied for table tickets" (42501) when scanning a
-- QR and calling markTicketUsed. The admin client also reads
-- orders / order_items / tickets, none of which had either a
-- table-level GRANT or an RLS policy for the authenticated role.
--
-- This migration grants the authenticated role on the three
-- tables and adds RLS policies restricting access to admin users
-- (via get_my_admin_role(), defined in 20260523000005).
-- ============================================================

-- Tickets ----------------------------------------------------
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'tickets' and policyname = 'Admins can read tickets'
  ) then
    execute $p$
      create policy "Admins can read tickets"
        on tickets for select
        using (get_my_admin_role() in ('super_admin', 'events_viewer'))
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'tickets' and policyname = 'Admins can update tickets'
  ) then
    execute $p$
      create policy "Admins can update tickets"
        on tickets for update
        using (get_my_admin_role() in ('super_admin', 'events_viewer'))
    $p$;
  end if;
end $$;

grant select, update on tickets to authenticated;

-- Orders -----------------------------------------------------
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'orders' and policyname = 'Admins can read orders'
  ) then
    execute $p$
      create policy "Admins can read orders"
        on orders for select
        using (get_my_admin_role() in ('super_admin', 'events_viewer'))
    $p$;
  end if;
end $$;

grant select on orders to authenticated;

-- Order items ------------------------------------------------
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'order_items' and policyname = 'Admins can read order_items'
  ) then
    execute $p$
      create policy "Admins can read order_items"
        on order_items for select
        using (get_my_admin_role() in ('super_admin', 'events_viewer'))
    $p$;
  end if;
end $$;

grant select on order_items to authenticated;
