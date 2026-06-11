-- Table QR ordering: track tables per event so admins can generate
-- per-table QR codes that link guests to the menu ordering page.

create table if not exists public.event_tables (
  id            uuid        default gen_random_uuid() primary key,
  event_id      uuid        references public.events(id) on delete cascade not null,
  table_number  int         not null,
  label         text,
  created_at    timestamptz default now() not null,
  unique(event_id, table_number)
);

alter table public.event_tables enable row level security;

-- Grant table-level privileges so PostgREST can see the table.
-- RLS policies handle row-level access on top of this.
grant select, insert, update, delete on table public.event_tables to authenticated;
grant select on table public.event_tables to anon;

drop policy if exists "Admins can read event_tables"   on public.event_tables;
drop policy if exists "Admins can insert event_tables" on public.event_tables;
drop policy if exists "Admins can update event_tables" on public.event_tables;
drop policy if exists "Admins can delete event_tables" on public.event_tables;

create policy "Admins can read event_tables"
  on public.event_tables for select
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager', 'events_viewer', 'scanner'));

create policy "Admins can insert event_tables"
  on public.event_tables for insert
  with check (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

create policy "Admins can update event_tables"
  on public.event_tables for update
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

create policy "Admins can delete event_tables"
  on public.event_tables for delete
  using (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));
