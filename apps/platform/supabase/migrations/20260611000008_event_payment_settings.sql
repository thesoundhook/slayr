-- Per-event payment configuration + direct bank transfer support.
-- Organisers choose which methods to accept, and (for transfer) provide a
-- bank account that is validated against Paystack's account-resolve API.

create table if not exists public.event_payment_settings (
  event_id                 uuid primary key references public.events(id) on delete cascade,
  ordering_enabled         boolean not null default true,
  accept_online            boolean not null default true,
  accept_pos               boolean not null default false,
  accept_transfer          boolean not null default false,
  -- Direct transfer destination (validated via Paystack resolve)
  transfer_bank_code       text,
  transfer_bank_name       text,
  transfer_account_number  text,
  transfer_account_name    text,
  transfer_instructions    text,
  updated_at               timestamptz not null default now()
);

alter table public.event_payment_settings enable row level security;

grant select                          on table public.event_payment_settings to anon;
grant select, insert, update, delete on table public.event_payment_settings to authenticated;
grant select, insert, update, delete on table public.event_payment_settings to service_role;

-- Public read so the checkout page can show enabled methods + transfer account
drop policy if exists "Public can read payment settings" on public.event_payment_settings;
create policy "Public can read payment settings"
  on public.event_payment_settings for select
  using (true);

-- Only management roles can configure
drop policy if exists "Admins can manage payment settings" on public.event_payment_settings;
create policy "Admins can manage payment settings"
  on public.event_payment_settings for all
  using   (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'))
  with check (get_my_admin_role() in ('super_admin', 'admin', 'event_manager'));

-- ── Extend table_orders to support direct transfer + payment proof ──────────
-- Ensure base payment columns exist (in case the earlier migration was skipped).
alter table public.table_orders
  add column if not exists payment_method text not null default 'online',
  add column if not exists is_paid        boolean not null default false,
  add column if not exists payment_proof_url text;

alter table public.table_orders
  drop constraint if exists table_orders_payment_method_check;

alter table public.table_orders
  add constraint table_orders_payment_method_check
  check (payment_method in ('online', 'pos', 'transfer'));

-- Backfill: verified online orders are paid
update public.table_orders
  set is_paid = true
  where paystack_verified = true and is_paid = false;

-- ── Storage bucket for transfer proof uploads ───────────────────────────────
insert into storage.buckets (id, name, public)
values ('order-proofs', 'order-proofs', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can upload order proofs" on storage.objects;
create policy "Anyone can upload order proofs"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'order-proofs');

drop policy if exists "Anyone can read order proofs" on storage.objects;
create policy "Anyone can read order proofs"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'order-proofs');
