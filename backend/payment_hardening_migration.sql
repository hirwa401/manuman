-- Payment hardening: one Stripe PaymentIntent maps to one booking.
-- Run this in Supabase SQL Editor before deploying the hardened payment API.
alter table bookings
  add column if not exists delivery_fee numeric default 0,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists payment_status text default 'unpaid',
  add column if not exists payment_idempotency_key text;

create unique index if not exists bookings_stripe_payment_intent_id_idx
  on bookings (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create unique index if not exists bookings_payment_idempotency_key_idx
  on bookings (payment_idempotency_key)
  where payment_idempotency_key is not null;

update bookings
set payment_status = case when payment_method = 'card' then 'paid' else 'unpaid' end
where payment_status is null;
