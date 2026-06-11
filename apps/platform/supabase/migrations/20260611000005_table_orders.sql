-- Table ordering system: orders placed by guests via QR-scanned menu.
-- Prices stored in kobo (×100) matching the rest of the platform.

create table if not exists public.table_orders (
  id                  uuid        default gen_random_uuid() primary key,
  event_id            uuid        references public.events(id) on delete cascade not null,
  table_number        int         not null,
  customer_name       text        not null,
  customer_phone      text        not null,
  subtotal            int         not null default 0,
  total               int         not null default 0,
  status              text        not null default 'pending'
                        check (status in ('pending', 'confirmed', 'preparing', 'served', 'cancelled')),
  paystack_reference  text,
  paystack_verified   boolean     not null default false,
  notes               text,
  created_at          timestamptz default now() not null
);

create table if not exists public.table_order_items (
  id            uuid  default gen_random_uuid() primary key,
  order_id      uuid  references public.table_orders(id) on delete cascade not null,
  menu_item_id  uuid  references public.menu_items(id) on delete set null,
  name          text  not null,
  quantity      int   not null default 1,
  unit_price    int   not null default 0,
  total_price   int   not null default 0,
  created_at    timestamptz default now() not null
);

alter table public.table_orders      enable row level security;
alter table public.table_order_items enable row level security;

-- Grants
grant select, insert, update, delete on table public.table_orders      to authenticated;
grant select, insert                  on table public.table_orders      to anon;
grant select, insert, update, delete on table public.table_orders      to service_role;
grant select, insert, update, delete on table public.table_order_items to authenticated;
grant select, insert                  on table public.table_order_items to anon;
grant select, insert, update, delete on table public.table_order_items to service_role;

-- table_orders: admins can do everything
drop policy if exists "Admins can manage table_orders" on public.table_orders;
create policy "Admins can manage table_orders"
  on public.table_orders for all
  using   (get_my_admin_role() in ('super_admin', 'admin', 'event_manager', 'events_viewer', 'scanner'))
  with check (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

-- table_orders: guests can insert (place order) and read their own
drop policy if exists "Guests can place table orders" on public.table_orders;
create policy "Guests can place table orders"
  on public.table_orders for insert
  with check (true);

drop policy if exists "Guests can read own table orders" on public.table_orders;
create policy "Guests can read own table orders"
  on public.table_orders for select
  using (true);

-- table_order_items
drop policy if exists "Admins can manage table_order_items" on public.table_order_items;
create policy "Admins can manage table_order_items"
  on public.table_order_items for all
  using   (get_my_admin_role() in ('super_admin', 'admin', 'event_manager', 'events_viewer', 'scanner'))
  with check (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

drop policy if exists "Guests can insert table_order_items" on public.table_order_items;
create policy "Guests can insert table_order_items"
  on public.table_order_items for insert
  with check (true);

drop policy if exists "Guests can read table_order_items" on public.table_order_items;
create policy "Guests can read table_order_items"
  on public.table_order_items for select
  using (true);
