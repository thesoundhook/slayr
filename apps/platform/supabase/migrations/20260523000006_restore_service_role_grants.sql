-- ============================================================
-- Restore service_role grants on event-related tables.
--
-- Background: the verify-payment-and-create-order edge function
-- was failing to read from `events` with "permission denied for
-- table events", even though it uses the service_role key.
-- Other tables (orders/order_items/tickets) still worked, so the
-- grant was selectively missing on events. Re-granting on all
-- tables the email flow touches.
-- ============================================================

grant select, insert, update, delete on events       to service_role;
grant select, insert, update, delete on venues       to service_role;
grant select, insert, update, delete on ticket_types to service_role;
grant select, insert, update, delete on organizers   to service_role;
