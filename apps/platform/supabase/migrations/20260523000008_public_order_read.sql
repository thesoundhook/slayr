-- Allow the platform frontend (anon key) to read orders, order_items, and
-- tickets by ID. Writes still go exclusively through the edge function
-- (service_role). The order UUID acts as an unguessable access token.

grant select on orders      to anon;
grant select on order_items to anon;
grant select on tickets     to anon;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'orders' and policyname = 'Public read orders by id'
  ) then
    execute $p$ create policy "Public read orders by id" on orders for select using (true) $p$;
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'order_items' and policyname = 'Public read order_items by order'
  ) then
    execute $p$ create policy "Public read order_items by order" on order_items for select using (true) $p$;
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'tickets' and policyname = 'Public read tickets by order'
  ) then
    execute $p$ create policy "Public read tickets by order" on tickets for select using (true) $p$;
  end if;
end $$;
