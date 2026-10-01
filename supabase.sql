-- Veel Thrifts shared backend — run this once in Supabase:
-- Dashboard → your project → SQL Editor → New query → paste → Run.

-- ------------------------------- tables -------------------------------

create table if not exists products (
  id text primary key,
  name text not null,
  brand text default 'Veel',
  price numeric not null,
  was numeric,
  size text default 'M',
  category text not null,
  audience text default 'Unisex',
  img text not null,
  alt text,
  "desc" text,
  created_at timestamptz default now()
);

create table if not exists orders (
  ref text primary key,
  date timestamptz default now(),
  items jsonb not null,
  subtotal numeric not null,
  phone text not null,
  location text not null,
  note text default '',
  status text default 'New'
);

-- --------------------------- access policies ---------------------------
-- Simple open model for a small shop: the storefront reads products and
-- creates orders; the admin site (passcode-gated) manages everything.
-- Tighten these later with Supabase Auth if you need private data.

alter table products enable row level security;
alter table orders enable row level security;

drop policy if exists "Public read products" on products;
create policy "Public read products" on products for select using (true);

drop policy if exists "Anon manage products" on products;
create policy "Anon manage products" on products for all using (true) with check (true);

drop policy if exists "Anon create orders" on orders;
create policy "Anon create orders" on orders for insert with check (true);

drop policy if exists "Anon read orders" on orders;
create policy "Anon read orders" on orders for select using (true);

drop policy if exists "Anon update orders" on orders;
create policy "Anon update orders" on orders for update using (true) with check (true);

drop policy if exists "Anon delete orders" on orders;
create policy "Anon delete orders" on orders for delete using (true);

-- ---------------------------- photo storage ----------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read images" on storage.objects;
create policy "Public read images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Anon upload images" on storage.objects;
create policy "Anon upload images" on storage.objects
  for insert with check (bucket_id = 'product-images');

drop policy if exists "Anon update images" on storage.objects;
create policy "Anon update images" on storage.objects
  for update using (bucket_id = 'product-images');

drop policy if exists "Anon delete images" on storage.objects;
create policy "Anon delete images" on storage.objects
  for delete using (bucket_id = 'product-images');
