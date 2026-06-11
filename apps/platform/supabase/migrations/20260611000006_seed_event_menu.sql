-- Event menu seed — replace the UUID below with the target event's id.
-- Prices stored in kobo (naira × 100). e.g. ₦12,000 = 1,200,000 kobo.

DO $$
DECLARE
  v_event_id uuid := 'REPLACE_WITH_EVENT_ID';
  v_cat      uuid;
BEGIN

  -- ── 1. AFRICAN DISHES ────────────────────────────────────────────────────
  INSERT INTO public.menu_categories (event_id, name, display_order)
  VALUES (v_event_id, 'African Dishes', 0) RETURNING id INTO v_cat;

  INSERT INTO public.menu_items (category_id, event_id, name, description, price, is_available, display_order) VALUES
    (v_cat, v_event_id, 'Afang Soup',                    'Stock Fish, Croaker Fish, Crayfish, Shrimps, Diced Ponmo, Periwinkle with any swallow of choice',                   1200000, true, 0),
    (v_cat, v_event_id, 'Ofe Nsala',                     'Assorted Meat, Stock Fish, Shrimps, Dry Fish, Periwinkle with any protein and swallow of choice',                   1300000, true, 1),
    (v_cat, v_event_id, 'Ogbono Soup',                   'Diced Ponmo, Stock Fish, Dry Fish, with any choice of swallow',                                                     1200000, true, 2),
    (v_cat, v_event_id, 'Ewedu Soup',                    'Blended Ewedu Leaf, Stew Sauce with any protein and swallow',                                                       1200000, true, 3),
    (v_cat, v_event_id, 'Egusi Soup',                    'Blended Egusi Seed cooked with Dry Fish, Stock Fish, Ugwu Leaf and swallow',                                        1200000, true, 4),
    (v_cat, v_event_id, 'Sea Food Okra',                 'Diced Okra with Shrimps, Croaker Fish/Titus Fish, Snail and Crab with swallow',                                     2000000, true, 5),
    (v_cat, v_event_id, 'Bitterleaf Soup',               'Water Leaf, Bitterleaf, Stock Fish, Dry Fish, Ponmo, Assorted, with protein and swallow',                           1200000, true, 6),
    (v_cat, v_event_id, 'Yam Porridge / Plantain Porridge', 'Dry Fish, Ponmo, Crayfish, Stock Fish and protein of choice',                                                    1200000, true, 7);

  -- ── 2. CONTINENTAL DISHES ─────────────────────────────────────────────────
  INSERT INTO public.menu_categories (event_id, name, display_order)
  VALUES (v_event_id, 'Continental Dishes', 1) RETURNING id INTO v_cat;

  INSERT INTO public.menu_items (category_id, event_id, name, description, price, is_available, display_order) VALUES
    (v_cat, v_event_id, 'Platter',                  'Beef chunks, Asun, sandwich, small chops, snail, fish finger, prawns, red wine, chicken burger, sausage', 5000000, true,  0),
    (v_cat, v_event_id, 'Cabbage Sauce',             'Shredded chicken, prawns, mushroom, served with rice of choice',                                          1500000, true,  1),
    (v_cat, v_event_id, 'Fisherman Soup',            'Prawns, Titus fish, croaker fish, catfish, stockfish, periwinkle, crabs',                                 1800000, true,  2),
    (v_cat, v_event_id, 'Coconut Rice',              'Shrimp, shredded beef/chicken, salad, crabs, mushroom',                                                   1300000, true,  3),
    (v_cat, v_event_id, 'Onion Sauce',               'Shredded chicken or beef, boiled egg, mushroom, served with rice or yam',                                 1200000, true,  4),
    (v_cat, v_event_id, 'Sandwich',                  'Sliced bread, chicken, omelette, cabbage, peas, mayonnaise',                                              1000000, true,  5),
    (v_cat, v_event_id, 'Beef & Cabbage Sauce',      'Shredded beef/chicken, red wine, mushroom, red pepper, green pepper, shrimp with rice',                   1200000, true,  6),
    (v_cat, v_event_id, 'Fish Rice',                 'Croaker/Titus fish, shrimps, scrambled egg, mushroom, vegetables',                                        1200000, true,  7),
    (v_cat, v_event_id, 'Chinese Fried Rice',        'Shrimps, shredded chicken, scrambled egg, vegetables',                                                    1000000, true,  8),
    (v_cat, v_event_id, 'Special Fried Rice',        NULL,                                                                                                       2400000, true,  9),
    (v_cat, v_event_id, 'Oriental Fried Rice',       NULL,                                                                                                       1900000, true, 10),
    (v_cat, v_event_id, 'Spaghetti Jambalaya',       NULL,                                                                                                       1500000, true, 11),
    (v_cat, v_event_id, 'Sea Food Pasta',            NULL,                                                                                                       2500000, true, 12),
    (v_cat, v_event_id, 'Sea Food Okro (Farmer''s Food)', NULL,                                                                                                  2000000, true, 13);

  -- ── 3. ADDITIONAL DISHES ─────────────────────────────────────────────────
  INSERT INTO public.menu_categories (event_id, name, display_order)
  VALUES (v_event_id, 'Additional Dishes', 2) RETURNING id INTO v_cat;

  INSERT INTO public.menu_items (category_id, event_id, name, description, price, is_available, display_order) VALUES
    (v_cat, v_event_id, 'Spaghetti Bolognese',                            NULL,  1500000, true,  0),
    (v_cat, v_event_id, 'Spaghetti Chicken Stir Fry',                     NULL,  1500000, true,  1),
    (v_cat, v_event_id, 'Spaghetti Beef Stir Fry',                        NULL,  1500000, true,  2),
    (v_cat, v_event_id, 'Chicken Penne Pasta Cream',                      NULL,  2500000, true,  3),
    (v_cat, v_event_id, 'Chicken Penne Pasta (Local)',                    NULL,  1500000, true,  4),
    (v_cat, v_event_id, 'Yamarita with Egg Sauce',                        NULL,  1200000, true,  5),
    (v_cat, v_event_id, 'Kloft Special (Chef Platter)',                   NULL,  3000000, true,  6),
    (v_cat, v_event_id, 'Chicken Pancake',                                NULL,  1000000, true,  7),
    (v_cat, v_event_id, 'Spaghetti Frittata',                             NULL,  1300000, true,  8),
    (v_cat, v_event_id, 'Golden Yam',                                     NULL,  1000000, true,  9),
    (v_cat, v_event_id, 'Coconut Sauce',                                  NULL,  1300000, true, 10),
    (v_cat, v_event_id, 'Turkey Fried Rice',                              NULL,  1200000, true, 11),
    (v_cat, v_event_id, 'Chicken Mexican',                                NULL,  1200000, true, 12),
    (v_cat, v_event_id, 'Chicken in Milk Sauce',                          NULL,  1500000, true, 13),
    (v_cat, v_event_id, 'Fillet Croaker Fish / Chicken in Lemon & Butter Sauce', NULL, 1500000, true, 14),
    (v_cat, v_event_id, 'Burger (Beef or Chicken)',                       NULL,   700000, true, 15),
    (v_cat, v_event_id, 'Vegetable Salad',                                NULL,  1000000, true, 16),
    (v_cat, v_event_id, 'Roasted Plantain with Sauce (Add-on)',           NULL,   150000, true, 17);

  -- ── 4. COCKTAILS ─────────────────────────────────────────────────────────
  INSERT INTO public.menu_categories (event_id, name, display_order)
  VALUES (v_event_id, 'Cocktails', 3) RETURNING id INTO v_cat;

  INSERT INTO public.menu_items (category_id, event_id, name, description, price, is_available, display_order) VALUES
    (v_cat, v_event_id, 'Sex on the Beach',          NULL,  800000, true,  0),
    (v_cat, v_event_id, 'Pina Colada',               NULL,  800000, true,  1),
    (v_cat, v_event_id, 'Margarita',                 NULL, 1000000, true,  2),
    (v_cat, v_event_id, 'Long Island Iced Tea',      NULL, 1000000, true,  3),
    (v_cat, v_event_id, 'Motherfvcker',              NULL, 1000000, true,  4),
    (v_cat, v_event_id, 'Passion Daiquiri',          NULL,  800000, true,  5),
    (v_cat, v_event_id, 'Screaming Multiple Orgasm', NULL, 1000000, true,  6),
    (v_cat, v_event_id, 'Mai Tai',                   NULL,  800000, true,  7),
    (v_cat, v_event_id, 'Lady''s Delight',           NULL, 1000000, true,  8),
    (v_cat, v_event_id, 'Pink Lady',                 NULL,  800000, true,  9),
    (v_cat, v_event_id, 'Jagermeister Pussy',        NULL,  800000, true, 10),
    (v_cat, v_event_id, 'Strawberry Pussy',          NULL,  800000, true, 11),
    (v_cat, v_event_id, 'Mango Daiquiri',            NULL,  800000, true, 12),
    (v_cat, v_event_id, 'Zombie',                    NULL,  800000, true, 13);

  -- ── 5. NON-ALCOHOLIC DRINKS ───────────────────────────────────────────────
  INSERT INTO public.menu_categories (event_id, name, display_order)
  VALUES (v_event_id, 'Non-Alcoholic Drinks', 4) RETURNING id INTO v_cat;

  INSERT INTO public.menu_items (category_id, event_id, name, description, price, is_available, display_order) VALUES
    (v_cat, v_event_id, 'Chapman',               NULL, 600000, true, 0),
    (v_cat, v_event_id, 'Banana Smoothie',        NULL, 700000, true, 1),
    (v_cat, v_event_id, 'Pineapple Smoothie',     NULL, 700000, true, 2),
    (v_cat, v_event_id, 'Watermelon Smoothie',    NULL, 700000, true, 3),
    (v_cat, v_event_id, 'Virgin Colada',          NULL, 700000, true, 4),
    (v_cat, v_event_id, 'Safe Sex on the Beach',  NULL, 700000, true, 5),
    (v_cat, v_event_id, 'Virgin Lady',            NULL, 700000, true, 6);

  -- ── 6. BEERS & MALT ──────────────────────────────────────────────────────
  INSERT INTO public.menu_categories (event_id, name, display_order)
  VALUES (v_event_id, 'Beers & Malt', 5) RETURNING id INTO v_cat;

  INSERT INTO public.menu_items (category_id, event_id, name, description, price, is_available, display_order) VALUES
    (v_cat, v_event_id, 'Budweiser',         NULL, 300000, true,  0),
    (v_cat, v_event_id, 'Trophy',            NULL, 250000, true,  1),
    (v_cat, v_event_id, 'Goldberg',          NULL, 250000, true,  2),
    (v_cat, v_event_id, 'Gulder',            NULL, 250000, true,  3),
    (v_cat, v_event_id, 'Castle Lite',       NULL, 300000, true,  4),
    (v_cat, v_event_id, 'Heineken',          NULL, 300000, true,  5),
    (v_cat, v_event_id, 'Mistrout',          NULL, 300000, true,  6),
    (v_cat, v_event_id, 'Desperado',         NULL, 350000, true,  7),
    (v_cat, v_event_id, 'Double Black',      NULL, 400000, true,  8),
    (v_cat, v_event_id, 'Plastic Origin',    NULL, 400000, true,  9),
    (v_cat, v_event_id, 'Smirnoff Ice (Big)',NULL, 250000, true, 10),
    (v_cat, v_event_id, 'Legend',            NULL, 250000, true, 11),
    (v_cat, v_event_id, 'Amstel',            NULL, 150000, true, 12),
    (v_cat, v_event_id, 'Peak Hollandia',    NULL, 400000, true, 13),
    (v_cat, v_event_id, 'Hollandia',         NULL, 400000, true, 14),
    (v_cat, v_event_id, 'Chivita',           NULL, 400000, true, 15);

  -- ── 7. SOFT DRINKS & ENERGY DRINKS ───────────────────────────────────────
  INSERT INTO public.menu_categories (event_id, name, display_order)
  VALUES (v_event_id, 'Soft Drinks & Energy Drinks', 6) RETURNING id INTO v_cat;

  INSERT INTO public.menu_items (category_id, event_id, name, description, price, is_available, display_order) VALUES
    (v_cat, v_event_id, 'Climax (Can)',    NULL, 350000, true,  0),
    (v_cat, v_event_id, 'Malta Guinness',  NULL, 250000, true,  1),
    (v_cat, v_event_id, 'Fayrouz',         NULL, 250000, true,  2),
    (v_cat, v_event_id, 'Flying Fish',     NULL, 300000, true,  3),
    (v_cat, v_event_id, 'Water',           NULL, 100000, true,  4),
    (v_cat, v_event_id, 'Coke',            NULL, 200000, true,  5),
    (v_cat, v_event_id, 'Fanta',           NULL, 200000, true,  6),
    (v_cat, v_event_id, 'Sprite',          NULL, 200000, true,  7),
    (v_cat, v_event_id, 'Monster',         NULL, 400000, true,  8),
    (v_cat, v_event_id, 'Black Bullet',    NULL, 300000, true,  9),
    (v_cat, v_event_id, 'Origin Beer',     NULL, 300000, true, 10);

  -- ── 8. PREMIUM ALCOHOL ───────────────────────────────────────────────────
  INSERT INTO public.menu_categories (event_id, name, display_order)
  VALUES (v_event_id, 'Premium Alcohol', 7) RETURNING id INTO v_cat;

  INSERT INTO public.menu_items (category_id, event_id, name, description, price, is_available, display_order) VALUES
    (v_cat, v_event_id, 'Campari',                  NULL,  4000000, true,  0),
    (v_cat, v_event_id, 'Observatory',               NULL,  8000000, true,  1),
    (v_cat, v_event_id, 'Glenfiddich 15 Years',      NULL, 14000000, true,  2),
    (v_cat, v_event_id, 'Glenfiddich 18 Years',      NULL, 22000000, true,  3),
    (v_cat, v_event_id, 'Glenfiddich 21 Years',      NULL, 45000000, true,  4),
    (v_cat, v_event_id, 'Casamigos',                 NULL, 21000000, true,  5),
    (v_cat, v_event_id, 'Belaire',                   NULL, 10000000, true,  6),
    (v_cat, v_event_id, 'Don Julio',                 NULL, 70000000, true,  7),
    (v_cat, v_event_id, 'Calorossy',                 NULL,  2500000, true,  8),
    (v_cat, v_event_id, 'Martell VS',                NULL, 10000000, true,  9),
    (v_cat, v_event_id, 'Drosty Hof',                NULL,  2500000, true, 10),
    (v_cat, v_event_id, 'Martell Swift',             NULL, 13000000, true, 11),
    (v_cat, v_event_id, 'Black Label',               NULL,  5000000, true, 12),
    (v_cat, v_event_id, 'Jagermeister',              NULL,  7000000, true, 13),
    (v_cat, v_event_id, 'Gordon''s',                 NULL,  1500000, true, 14),
    (v_cat, v_event_id, 'Four Cousins',              NULL,  3000000, true, 15),
    (v_cat, v_event_id, 'Absolut Vodka',             NULL,  4000000, true, 16),
    (v_cat, v_event_id, 'Jack Daniel''s',            NULL,  5000000, true, 17),
    (v_cat, v_event_id, 'Hennessy VSOP',             NULL, 17000000, true, 18),
    (v_cat, v_event_id, 'Hennessy VS',               NULL,  9000000, true, 19),
    (v_cat, v_event_id, 'Jameson',                   NULL,  4000000, true, 20),
    (v_cat, v_event_id, 'William Lawson',            NULL,  2500000, true, 21),
    (v_cat, v_event_id, 'Blue Nun Authentic White',  NULL,  2500000, true, 22),
    (v_cat, v_event_id, 'Blue Nun Premium Ice',      NULL,  4000000, true, 23),
    (v_cat, v_event_id, 'Blue Nun Pink Ice',         NULL,  2000000, true, 24),
    (v_cat, v_event_id, 'Blue Nun Rose',             NULL,  5000000, true, 25),
    (v_cat, v_event_id, 'Blue Nun Gold',             NULL,  6000000, true, 26),
    (v_cat, v_event_id, 'Olmeca',                    NULL,  6000000, true, 27);

END $$;
