-- Staff numbers that receive a WhatsApp alert for EVERY new order on this event
-- (in addition to the table's assigned usher). The send-whatsapp function splits
-- notify_whatsapp_number on commas / newlines / semicolons, so multiple numbers
-- live in the single field. event_id is derived from a known menu item of this
-- event (the same anchor used by the earlier seed migrations).
--   Anchor: Pina Colada — 30231a70-e61f-4ddd-9806-19b6ea73dd42
--   Numbers: 08135811248, 09135152991, 09024156071

BEGIN;

WITH ev AS (
  SELECT event_id FROM public.menu_items WHERE id = '30231a70-e61f-4ddd-9806-19b6ea73dd42'
)
INSERT INTO public.event_payment_settings (event_id, notify_whatsapp_number)
SELECT event_id, '08135811248, 09135152991, 09024156071' FROM ev
ON CONFLICT (event_id) DO UPDATE SET notify_whatsapp_number = EXCLUDED.notify_whatsapp_number;

COMMIT;
