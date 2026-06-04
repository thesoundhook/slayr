-- Add configurable service fee percentage per event.
-- Stored as a plain decimal (e.g. 4.5 means 4.5%).
-- Existing events default to 4.5 to match the new standard rate.
alter table events
  add column service_fee_percentage numeric(5,2) not null default 4.5;
