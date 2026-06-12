-- Update event menu prices from updated price list (handwritten note, 2026-06-12).
-- Prices stored in kobo (naira × 100). Matches by item_id to avoid name ambiguity.

BEGIN;

-- ════════════════════════ PRICE UPDATES ════════════════════════
-- PREMIUM ALCOHOL
UPDATE public.menu_items SET price =  5500000 WHERE id = 'a6aa6fe4-95b1-4aa3-bfc0-06e82db40e0f'; -- Campari        → ₦55,000
UPDATE public.menu_items SET price = 10000000 WHERE id = '698facdd-e00c-4254-982a-46984ea0bb4a'; -- Observatory    → ₦100,000
UPDATE public.menu_items SET price = 15000000 WHERE id = 'eb9caf0c-6cb1-468a-baa0-3784c2976998'; -- Glenfiddich 15 → ₦150,000
UPDATE public.menu_items SET price = 25000000 WHERE id = '863ac37c-77f2-474a-a747-acef1154abe9'; -- Glenfiddich 18 → ₦250,000
UPDATE public.menu_items SET price = 50000000 WHERE id = 'bfa4dbb4-f5d3-4cf0-879b-f914c6fe064a'; -- Glenfiddich 21 → ₦500,000
UPDATE public.menu_items SET price = 80000000 WHERE id = '25bad59c-1762-4a1f-acd9-5e2dd82c7265'; -- Don Julio      → ₦800,000
UPDATE public.menu_items SET price = 12500000 WHERE id = '64fc01d1-6271-401a-bfd3-6c9bd88202f8'; -- Martell VS     → ₦125,000
UPDATE public.menu_items SET price = 15500000 WHERE id = '95c49e24-2156-45fc-8521-7b0ed79c0e44'; -- Martell Swift  → ₦155,000
UPDATE public.menu_items SET price =  7000000 WHERE id = '1bc15f06-27a2-4daf-b650-9667cc864f9d'; -- Black Label    → ₦70,000
UPDATE public.menu_items SET price =  7500000 WHERE id = 'a9d513bc-abb0-49fb-b050-6090e01b6774'; -- Jagermeister   → ₦75,000
UPDATE public.menu_items SET price =  3000000 WHERE id = 'bb759d0a-d06f-41e0-aee9-58613319f897'; -- Gordon's       → ₦30,000
UPDATE public.menu_items SET price =  4000000 WHERE id = '17ad58f6-845b-41e0-bd98-7487d407273e'; -- Four Cousins   → ₦40,000
UPDATE public.menu_items SET price = 20000000 WHERE id = '5343fa7a-d5d5-482b-b937-dacfd84283ef'; -- Hennessy VSOP  → ₦200,000
UPDATE public.menu_items SET price = 12000000 WHERE id = '7d57073c-6f4c-45bb-a929-5a85e1b6631e'; -- Hennessy VS    → ₦120,000
UPDATE public.menu_items SET price =  6500000 WHERE id = 'd138341d-7cab-4101-9765-9609e3ada40f'; -- Jack Daniel's  → ₦65,000
UPDATE public.menu_items SET price =  3500000 WHERE id = '225d6e6f-d042-4dc5-85d0-8f19b3336f45'; -- Calorossy      → ₦35,000
UPDATE public.menu_items SET price = 40000000 WHERE id = 'cb0a14fa-2943-4382-8869-9d18f0ee33ef'; -- Casamigos      → ₦400,000

-- Jameson: rename existing generic → "Jameson Irish" @ ₦50,000
UPDATE public.menu_items SET name = 'Jameson Irish', price = 5000000
  WHERE id = '9d8b8a7c-abee-4d31-a6aa-092661823da0';

-- Crossed-out items → mark unavailable (kept in DB)
UPDATE public.menu_items SET is_available = false WHERE id = '583e6758-4430-47b4-8c3f-06be66b0a78d'; -- Olmeca
UPDATE public.menu_items SET is_available = false WHERE id = '70485e8a-5e05-40c7-b197-ab494624143e'; -- Blue Nun Gold

-- SOFT DRINKS & ENERGY
UPDATE public.menu_items SET price = 200000 WHERE id = '4e149b34-ca94-4493-bed9-81638ce99cec'; -- Water        → ₦2,000
UPDATE public.menu_items SET price = 300000 WHERE id = 'd465742d-ebb5-4dfc-b6ba-011acbcbb63c'; -- Coke         → ₦3,000
UPDATE public.menu_items SET price = 300000 WHERE id = '043674f6-bdd2-4d59-8669-0237c91127cc'; -- Fanta        → ₦3,000
UPDATE public.menu_items SET price = 300000 WHERE id = '3a54f049-22a7-4bed-bb3d-0adafafda4ad'; -- Sprite       → ₦3,000
UPDATE public.menu_items SET price = 300000 WHERE id = 'b081515a-fb65-4a14-867a-9b5427af79e0'; -- Fayrouz      → ₦3,000
UPDATE public.menu_items SET price = 500000 WHERE id = '2a93afb4-9310-4e1c-a9b0-fd25fc4c9770'; -- Monster      → ₦5,000
UPDATE public.menu_items SET price = 800000 WHERE id = 'd3c772e2-828f-4ad7-9060-0592ac2147ea'; -- Black Bullet → ₦8,000

-- BEERS & MALT
UPDATE public.menu_items SET price = 500000 WHERE id = '64c1175f-9b4d-4811-b859-c8a23098b77a'; -- Double Black → ₦5,000
UPDATE public.menu_items SET price = 500000 WHERE id = 'f1c0ce0b-feb6-48e8-adee-fe5b431bd309'; -- Hollandia    → ₦5,000

-- COCKTAILS
UPDATE public.menu_items SET price = 1000000 WHERE id = '30231a70-e61f-4ddd-9806-19b6ea73dd42'; -- Pina Colada      → ₦10,000
UPDATE public.menu_items SET price = 1000000 WHERE id = '50aca7f5-4dce-47b7-b3d3-c1c9fb406caa'; -- Sex on the Beach → ₦10,000
UPDATE public.menu_items SET price = 1200000 WHERE id = '7a992a66-2799-4b91-9458-06510cab8ca6'; -- Long Island      → ₦12,000
UPDATE public.menu_items SET price = 1000000 WHERE id = '6326e963-f146-47d9-9a55-e83e9a9ef894'; -- Strawberry Pussy → ₦10,000
UPDATE public.menu_items SET price = 1000000 WHERE id = '926961ad-394d-439f-8ff4-dd4a3f9ca77b'; -- Pink Lady        → ₦10,000
UPDATE public.menu_items SET price = 1200000 WHERE id = '9ff3ca9d-f0c2-4524-8499-57438d6b8d86'; -- Margarita        → ₦12,000
-- Screaming Multiple Orgasm already ₦10,000 — no change

-- ════════════════════════ NEW ITEMS ════════════════════════
-- Premium Alcohol additions (category_id + event_id sourced from Campari's row)
INSERT INTO public.menu_items (category_id, event_id, name, price, is_available, display_order)
SELECT src.category_id, src.event_id, v.name, v.price, true,
       (SELECT COALESCE(MAX(display_order),0) FROM public.menu_items m WHERE m.category_id = src.category_id) + v.ord
FROM public.menu_items src
JOIN (VALUES
  ('Moet Brut',     25000000, 1),
  ('Moet Rose',     30000000, 2),
  ('Jameson Black',  8500000, 3)
) AS v(name, price, ord) ON true
WHERE src.id = 'a6aa6fe4-95b1-4aa3-bfc0-06e82db40e0f';

-- Cocktail additions (sourced from Pina Colada's row)
INSERT INTO public.menu_items (category_id, event_id, name, price, is_available, display_order)
SELECT src.category_id, src.event_id, v.name, v.price, true,
       (SELECT COALESCE(MAX(display_order),0) FROM public.menu_items m WHERE m.category_id = src.category_id) + v.ord
FROM public.menu_items src
JOIN (VALUES
  ('Strawberry Daiquiri', 1000000, 1),
  ('My Lady',             1200000, 2)
) AS v(name, price, ord) ON true
WHERE src.id = '30231a70-e61f-4ddd-9806-19b6ea73dd42';

-- Shisha → new "Extras" category for this event
WITH ev AS (
  SELECT event_id FROM public.menu_items WHERE id = '30231a70-e61f-4ddd-9806-19b6ea73dd42'
),
newcat AS (
  INSERT INTO public.menu_categories (event_id, name, display_order)
  SELECT ev.event_id, 'Extras',
         (SELECT COALESCE(MAX(display_order),0)+1 FROM public.menu_categories c WHERE c.event_id = ev.event_id)
  FROM ev
  RETURNING id, event_id
)
INSERT INTO public.menu_items (category_id, event_id, name, price, is_available, display_order)
SELECT id, event_id, 'Shisha', 1500000, true, 0 FROM newcat;

COMMIT;
