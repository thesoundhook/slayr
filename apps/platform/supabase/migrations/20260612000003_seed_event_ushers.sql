-- Seed staff notify number + ushers for this event, and assign ushers to tables.
-- The event_id is derived from a known menu item of this event (the same anchor
-- used by 20260612000001_update_event_menu_prices.sql) so we don't hard-code a UUID.
--   Anchor: Pina Colada — 30231a70-e61f-4ddd-9806-19b6ea73dd42
--
--   Admin notify number : 08135811248
--   Mercy  (09138292004) → tables 1–5
--   Busola (07044227238) → tables 6–13

BEGIN;

-- ── Event-wide staff alert number ─────────────────────────────────────────────
WITH ev AS (
  SELECT event_id FROM public.menu_items WHERE id = '30231a70-e61f-4ddd-9806-19b6ea73dd42'
)
INSERT INTO public.event_payment_settings (event_id, notify_whatsapp_number)
SELECT event_id, '08135811248' FROM ev
ON CONFLICT (event_id) DO UPDATE SET notify_whatsapp_number = EXCLUDED.notify_whatsapp_number;

-- ── Ushers + table assignment ─────────────────────────────────────────────────
WITH ev AS (
  SELECT event_id FROM public.menu_items WHERE id = '30231a70-e61f-4ddd-9806-19b6ea73dd42'
),
ins AS (
  INSERT INTO public.event_ushers (event_id, name, phone)
  SELECT ev.event_id, v.name, v.phone
  FROM ev
  JOIN (VALUES
    ('Mercy',  '09138292004'),
    ('Busola', '07044227238')
  ) AS v(name, phone) ON true
  RETURNING id, name, event_id
)
UPDATE public.event_tables t
SET usher_id = ins.id
FROM ins
WHERE t.event_id = ins.event_id
  AND (
    (ins.name = 'Mercy'  AND t.table_number BETWEEN 1 AND 5)  OR
    (ins.name = 'Busola' AND t.table_number BETWEEN 6 AND 13)
  );

COMMIT;
