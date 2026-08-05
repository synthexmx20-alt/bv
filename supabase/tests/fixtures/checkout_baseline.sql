do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  role text default 'customer'
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  value numeric not null,
  expiration_date timestamptz,
  usage_limit integer,
  usage_count integer default 0,
  active boolean default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  total_amount numeric,
  status text default 'pending',
  shipping_details jsonb,
  message_details jsonb,
  created_at timestamptz default timezone('utc', now()) not null,
  payment_id text,
  coupon_code text,
  discount_amount numeric default 0
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id text,
  product_name text,
  quantity integer,
  price numeric,
  size text,
  addons jsonb default '[]'::jsonb
);
