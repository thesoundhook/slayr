-- Keep events.sold_tickets in sync with the sum of ticket_types.sold.
-- Fires after any update to ticket_types.sold so the column is always accurate.

create or replace function sync_event_sold_tickets()
returns trigger language plpgsql as $$
begin
  update events
  set sold_tickets = (
    select coalesce(sum(sold), 0)
    from ticket_types
    where event_id = new.event_id
  )
  where id = new.event_id;
  return new;
end;
$$;

drop trigger if exists trg_sync_event_sold_tickets on ticket_types;
create trigger trg_sync_event_sold_tickets
  after update of sold on ticket_types
  for each row
  execute function sync_event_sold_tickets();

-- Backfill existing events so current data is correct immediately.
update events e
set sold_tickets = (
  select coalesce(sum(tt.sold), 0)
  from ticket_types tt
  where tt.event_id = e.id
);
