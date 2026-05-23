-- ============================================================
-- Seed: Asake Listening Party
-- Run this AFTER the migration in the Supabase Dashboard SQL editor.
-- ============================================================

-- Step 1: Venue
insert into venues (id, name, address, city, state, country, capacity, has_seating_chart)
values (
  'a1b2c3d4-0001-0000-0000-000000000000',
  'Kloft Lounge & Bar',
  'NEPA Road, By Adegbemile Street',
  'Akure',
  'Ondo',
  'Nigeria',
  500,
  false
);

-- Step 2: Organizer
insert into organizers (id, name, verified)
values (
  'a1b2c3d4-0002-0000-0000-000000000000',
  'Slayr Events',
  true
);

-- Step 3: Event
insert into events (
  id, title, description, category, date, time,
  venue_id, organizer_id, images, tags, total_capacity, featured, status
)
values (
  'a1b2c3d4-0003-0000-0000-000000000000',
  'Asake Listening Party Akure',
  'Experience the next chapter of Asake''s music before the rest of the world. Join us at Kloft, Akure for an exclusive listening party — his unreleased album, immersive sound, and the raw energy that built him. Expect curated visuals, live freestyles, surprise appearances, and an afterparty that goes till sunrise. This is not just a listening session. This is a movement.',
  'music',
  '2026-07-12',
  '20:00',
  'a1b2c3d4-0001-0000-0000-000000000000',
  'a1b2c3d4-0002-0000-0000-000000000000',
  array[
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    'https://images.unsplash.com/photo-1540039155733-5bb30b4e5c65?w=800'
  ],
  array['asake', 'afrobeats', 'listening-party', 'akure', 'street-hop', 'album-launch'],
  500,
  true,
  'upcoming'
);

-- Step 4: Ticket types (prices in kobo — ₦1 = 100 kobo)
insert into ticket_types (event_id, name, description, price, original_price, quantity, max_per_order, type)
values
  -- Early Bird ₦8,000 (was ₦12,000)
  (
    'a1b2c3d4-0003-0000-0000-000000000000',
    'Early Bird',
    'Limited early bird tickets — grab yours before they sell out. General floor access.',
    800000,    -- ₦8,000
    1200000,   -- ₦12,000 original
    100,
    4,
    'early-bird'
  ),
  -- Regular ₦12,000
  (
    'a1b2c3d4-0003-0000-0000-000000000000',
    'General Admission',
    'Full floor access, open bar (first 2 drinks on us), and access to the listening room.',
    1200000,   -- ₦12,000
    null,
    300,
    6,
    'general'
  ),
  -- VIP ₦30,000
  (
    'a1b2c3d4-0003-0000-0000-000000000000',
    'VIP',
    'Elevated viewing area, dedicated bar, VIP lounge access, complimentary drinks all night, and a gift pack.',
    3000000,   -- ₦30,000
    null,
    80,
    4,
    'vip'
  ),
  -- VVIP Table ₦80,000 per person
  (
    'a1b2c3d4-0003-0000-0000-000000000000',
    'VVIP Table',
    'Reserved table seating, premium bottle service, closest position to the stage, dedicated host, and access to the post-event meet & greet.',
    8000000,   -- ₦80,000
    null,
    20,
    2,
    'vip'
  );
