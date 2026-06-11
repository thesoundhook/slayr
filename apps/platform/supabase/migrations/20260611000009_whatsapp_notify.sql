-- Optional staff WhatsApp number to receive new-order alerts for an event.
alter table public.event_payment_settings
  add column if not exists notify_whatsapp_number text;
