-- schema.sql
-- Lameboy — Stripe + Supabase + Shippo schema
-- Run this against a fresh Supabase Postgres database.

create extension if not exists "pgcrypto";

-- ─── products ──────────────────────────────────────────────────────────────
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  category    text,
  image_url   text,
  thumb_url   text,
  created_at  timestamptz not null default now()
);

-- ─── variants ──────────────────────────────────────────────────────────────
-- weight/dimensions live here because Shippo needs a per-item parcel size
-- to quote live shipping rates.
create table if not exists variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  size        text not null,
  color       text,
  stock       integer not null default 0,
  price_cents integer not null,
  weight_oz   numeric not null,
  length_in   numeric not null,
  width_in    numeric not null,
  height_in   numeric not null,
  created_at  timestamptz not null default now(),
  unique (product_id, size, color)
);

create index if not exists variants_product_id_idx on variants(product_id);

-- ─── orders ────────────────────────────────────────────────────────────────
-- Rows are only ever inserted by the Stripe webhook handler
-- (payment_intent.succeeded) — never by client-side code.
create table if not exists orders (
  id                     uuid primary key default gen_random_uuid(),
  stripe_payment_intent_id text not null unique,
  email                  text not null,
  name                   text not null,
  shipping_address       jsonb not null,
  shipping_carrier       text,
  shipping_service       text,
  shipping_cost_cents    integer not null default 0,
  subtotal_cents         integer not null,
  total_cents            integer not null,
  status                 text not null default 'paid',
  created_at             timestamptz not null default now()
);

create index if not exists orders_payment_intent_idx on orders(stripe_payment_intent_id);

-- ─── order_items ───────────────────────────────────────────────────────────
create table if not exists order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  variant_id     uuid references variants(id),
  name_snapshot  text not null,
  size_snapshot  text,
  price_cents    integer not null,
  qty            integer not null
);

create index if not exists order_items_order_id_idx on order_items(order_id);

-- ─── RLS ───────────────────────────────────────────────────────────────────
-- All access goes through the server (Supabase service role key), which
-- bypasses RLS. Enabling RLS with no policies denies the anon/public key
-- entirely, so nothing here is queryable directly from the browser.
alter table products enable row level security;
alter table variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
