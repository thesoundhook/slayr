-- Add soft-delete flag so ticket types with existing orders can be
-- "removed" from an event without breaking the order_items FK constraint.
alter table ticket_types
  add column is_archived boolean not null default false;

create index on ticket_types(is_archived);
