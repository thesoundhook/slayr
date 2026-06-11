-- Add a human-readable name and a ticket-type association to each table.
-- name:           e.g. "VIP Corner Table", "Table Alpha" — displayed on QR cards.
-- ticket_type_id: links this table to the ticket type it belongs to so non-table
--                 ticket types (e.g. General Admission) can be excluded.

alter table public.event_tables
  add column if not exists name           text,
  add column if not exists ticket_type_id uuid references public.ticket_types(id) on delete set null;
