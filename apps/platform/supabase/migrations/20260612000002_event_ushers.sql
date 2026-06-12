-- Ushers: lightweight per-event staff (name + WhatsApp number, no login) who can
-- be assigned to tables. When an order is placed at a table, its assigned usher
-- receives a WhatsApp alert (in addition to the event-wide notify number).

create table if not exists public.event_ushers (
  id          uuid        default gen_random_uuid() primary key,
  event_id    uuid        references public.events(id) on delete cascade not null,
  name        text        not null,
  phone       text        not null,
  created_at  timestamptz default now() not null
);

create index if not exists event_ushers_event_id_idx on public.event_ushers(event_id);

-- Link a table to (at most) one usher. One usher may cover many tables.
alter table public.event_tables
  add column if not exists usher_id uuid references public.event_ushers(id) on delete set null;

alter table public.event_ushers enable row level security;

-- Table-level privileges so PostgREST can see the table; RLS handles row access.
grant select, insert, update, delete on table public.event_ushers to authenticated;
grant select, insert, update, delete on table public.event_ushers to service_role;

drop policy if exists "Admins can read event_ushers"   on public.event_ushers;
drop policy if exists "Admins can insert event_ushers" on public.event_ushers;
drop policy if exists "Admins can update event_ushers" on public.event_ushers;
drop policy if exists "Admins can delete event_ushers" on public.event_ushers;

create policy "Admins can read event_ushers"
  on public.event_ushers for select
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager', 'events_viewer', 'scanner'));

create policy "Admins can insert event_ushers"
  on public.event_ushers for insert
  with check (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

create policy "Admins can update event_ushers"
  on public.event_ushers for update
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

create policy "Admins can delete event_ushers"
  on public.event_ushers for delete
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));
