-- ============================================================
-- Expand RLS policies on tickets / orders / order_items to cover
-- the new admin roles: admin, event_manager, scanner.
-- ============================================================

-- Tickets: drop old policies and recreate with full role list
drop policy if exists "Admins can read tickets"   on tickets;
drop policy if exists "Admins can update tickets" on tickets;

create policy "Admins can read tickets"
  on tickets for select
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager', 'events_viewer', 'scanner'));

create policy "Admins can update tickets"
  on tickets for update
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager', 'events_viewer', 'scanner'));

-- Orders
drop policy if exists "Admins can read orders" on orders;

create policy "Admins can read orders"
  on orders for select
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager', 'events_viewer', 'scanner'));

-- Order items
drop policy if exists "Admins can read order_items" on order_items;

create policy "Admins can read order_items"
  on order_items for select
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager', 'events_viewer', 'scanner'));
