-- ============================================================
-- Event Ticketing Platform — Initial Schema
-- Run this in the Supabase Dashboard SQL editor
-- ============================================================

-- VENUES
create table venues (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  address           text not null,
  city              text not null,
  state             text not null,
  country           text not null,
  capacity          integer not null,
  has_seating_chart boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ORGANIZERS
create table organizers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  description text,
  verified    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- EVENTS
create table events (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text not null,
  category       text not null check (
    category in ('music','sports','theater','comedy','conferences',
                 'workshops','food','arts','family','nightlife','other')
  ),
  date           date not null,
  time           time not null,
  venue_id       uuid not null references venues(id),
  organizer_id   uuid not null references organizers(id),
  images         text[] not null default '{}',
  tags           text[] not null default '{}',
  total_capacity integer not null,
  sold_tickets   integer not null default 0,
  featured       boolean not null default false,
  status         text not null default 'upcoming' check (
    status in ('upcoming','ongoing','past','cancelled')
  ),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- TICKET_TYPES (child of event)
-- Prices are stored in KOBO (100 kobo = ₦1). e.g. ₦5,000 = 500000 kobo
create table ticket_types (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  name           text not null,
  description    text,
  price          integer not null,         -- in kobo
  original_price integer,                  -- in kobo, for strike-through display
  quantity       integer not null,
  sold           integer not null default 0,
  max_per_order  integer not null default 10,
  sales_start    timestamptz,
  sales_end      timestamptz,
  type           text not null default 'general' check (
    type in ('general','vip','early-bird','group')
  ),
  created_at     timestamptz not null default now()
);

-- ORDERS (created by Edge Function after Paystack verification)
create table orders (
  id                  uuid primary key default gen_random_uuid(),
  customer_email      text not null,
  customer_first_name text not null,
  customer_last_name  text not null,
  customer_phone      text,
  subtotal            integer not null,   -- in kobo
  fees                integer not null,   -- in kobo
  total               integer not null,   -- in kobo
  status              text not null default 'pending' check (
    status in ('pending','confirmed','cancelled','refunded')
  ),
  paystack_reference  text unique,
  paystack_verified   boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ORDER_ITEMS
create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  event_id        uuid not null references events(id),
  ticket_type_id  uuid not null references ticket_types(id),
  quantity        integer not null,
  unit_price      integer not null,   -- kobo, locked at purchase time
  total_price     integer not null    -- quantity * unit_price
);

-- TICKETS (one row per individual ticket)
create table tickets (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  order_item_id   uuid not null references order_items(id),
  event_id        uuid not null references events(id),
  ticket_type_id  uuid not null references ticket_types(id),
  qr_code         text unique not null,
  used            boolean not null default false,
  used_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- INDEXES
create index on events(status);
create index on events(category);
create index on events(featured);
create index on ticket_types(event_id);
create index on orders(paystack_reference);
create index on order_items(order_id);
create index on tickets(order_id);
create index on tickets(qr_code);

-- AUTO-UPDATE updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger events_updated_at
  before update on events
  execute function update_updated_at();

create trigger orders_updated_at
  before update on orders
  execute function update_updated_at();

-- SAFE SOLD-COUNT INCREMENT (prevents overselling)
create or replace function increment_sold(p_ticket_type_id uuid, p_quantity integer)
returns void language plpgsql security definer as $$
begin
  update ticket_types
  set sold = sold + p_quantity
  where id = p_ticket_type_id
    and sold + p_quantity <= quantity;

  if not found then
    raise exception 'Tickets sold out or not found for id: %', p_ticket_type_id;
  end if;
end; $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table events       enable row level security;
alter table ticket_types enable row level security;
alter table venues       enable row level security;
alter table organizers   enable row level security;
alter table orders       enable row level security;
alter table order_items  enable row level security;
alter table tickets      enable row level security;

-- Public read on event/venue/organizer data
create policy "Public read events"
  on events for select using (true);

create policy "Public read ticket_types"
  on ticket_types for select using (true);

create policy "Public read venues"
  on venues for select using (true);

create policy "Public read organizers"
  on organizers for select using (true);

-- Orders and tickets: no direct client writes — Edge Function uses service_role (bypasses RLS)
-- No INSERT/UPDATE policies on orders, order_items, or tickets for the anon key
