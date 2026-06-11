-- Event menu system: categories and items per event.
-- Price stored in kobo (×100) matching ticket pricing convention.

create table if not exists public.menu_categories (
  id            uuid        default gen_random_uuid() primary key,
  event_id      uuid        references public.events(id) on delete cascade not null,
  name          text        not null,
  display_order int         not null default 0,
  created_at    timestamptz default now() not null
);

create table if not exists public.menu_items (
  id            uuid        default gen_random_uuid() primary key,
  category_id   uuid        references public.menu_categories(id) on delete cascade not null,
  event_id      uuid        references public.events(id) on delete cascade not null,
  name          text        not null,
  description   text,
  price         int         not null default 0,
  image_url     text,
  is_available  boolean     not null default true,
  display_order int         not null default 0,
  created_at    timestamptz default now() not null
);

-- RLS
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;

-- Grants so PostgREST can reach these tables
grant select, insert, update, delete on table public.menu_categories to authenticated;
grant select                          on table public.menu_categories to anon;
grant select, insert, update, delete on table public.menu_items      to authenticated;
grant select                          on table public.menu_items      to anon;

-- menu_categories policies
drop policy if exists "Admins can read menu_categories"   on public.menu_categories;
drop policy if exists "Admins can write menu_categories"  on public.menu_categories;
drop policy if exists "Admins can update menu_categories" on public.menu_categories;
drop policy if exists "Admins can delete menu_categories" on public.menu_categories;
drop policy if exists "Public can read menu_categories"   on public.menu_categories;

create policy "Admins can read menu_categories"
  on public.menu_categories for select
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager', 'events_viewer', 'scanner'));

create policy "Admins can write menu_categories"
  on public.menu_categories for insert
  with check (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

create policy "Admins can update menu_categories"
  on public.menu_categories for update
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

create policy "Admins can delete menu_categories"
  on public.menu_categories for delete
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

-- Public read for guests scanning QR codes
create policy "Public can read menu_categories"
  on public.menu_categories for select
  using (true);

-- menu_items policies
drop policy if exists "Admins can read menu_items"   on public.menu_items;
drop policy if exists "Admins can write menu_items"  on public.menu_items;
drop policy if exists "Admins can update menu_items" on public.menu_items;
drop policy if exists "Admins can delete menu_items" on public.menu_items;
drop policy if exists "Public can read menu_items"   on public.menu_items;

create policy "Admins can read menu_items"
  on public.menu_items for select
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager', 'events_viewer', 'scanner'));

create policy "Admins can write menu_items"
  on public.menu_items for insert
  with check (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

create policy "Admins can update menu_items"
  on public.menu_items for update
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

create policy "Admins can delete menu_items"
  on public.menu_items for delete
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

-- Public read for guests scanning QR codes
create policy "Public can read menu_items"
  on public.menu_items for select
  using (true);
