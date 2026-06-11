-- Add payment method + paid flag so guests can either pay online (Paystack)
-- or pay at the table via POS (an attendant marks it paid afterwards).

alter table public.table_orders
  add column if not exists payment_method text not null default 'online'
    check (payment_method in ('online', 'pos')),
  add column if not exists is_paid boolean not null default false;

-- Backfill: existing online orders that were verified are paid.
update public.table_orders
  set is_paid = true
  where paystack_verified = true and is_paid = false;
