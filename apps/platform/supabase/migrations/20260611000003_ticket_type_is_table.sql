-- Flag a ticket type as table-based so the admin can generate
-- per-table QR codes only for the relevant ticket types.

alter table public.ticket_types
  add column if not exists is_table_ticket boolean not null default false;
