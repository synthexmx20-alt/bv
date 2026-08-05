-- Create profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users not null,
  role text default 'user',
  primary key (id)
);

-- Create orders table
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  total_amount numeric not null,
  status text default 'pending',
  shipping_details jsonb,
  message_details jsonb
);

-- Create order_items table
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders not null,
  product_id text not null,
  product_name text not null,
  quantity integer not null,
  price numeric not null,
  size text
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Policies for Orders
create policy "Users can view their own orders."
  on public.orders for select
  using ( auth.uid() = user_id );

create policy "Admins can view all orders"
    on public.orders for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Admins can update all orders"
    on public.orders for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Users can insert their own orders."
  on public.orders for insert
  with check ( auth.uid() = user_id );

-- Policies for Order Items
create policy "Users can view their own order items."
  on public.order_items for select
  using ( 
    exists ( 
      select 1 from public.orders 
      where orders.id = order_items.order_id 
      and orders.user_id = auth.uid() 
    ) 
  );

create policy "Admins can view all order items"
    on public.order_items for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Users can insert their own order items."
  on public.order_items for insert
  with check ( 
    exists ( 
      select 1 from public.orders 
      where orders.id = order_items.order_id 
      and orders.user_id = auth.uid() 
    ) 
  );

-- Trigger to create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$ language plpgsql security definer;

  for each row execute procedure public.handle_new_user();

-- Create occasions table
create table public.occasions (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for occasions
alter table public.occasions enable row level security;

-- Policies for Occasions
create policy "Occasions are viewable by everyone."
  on public.occasions for select
  using ( true );

create policy "Admins can insert occasions"
    on public.occasions for insert
    with check (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Admins can update occasions"
    on public.occasions for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Admins can delete occasions"
    on public.occasions for delete
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Create cart_items table
create table public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  product_id uuid references public.products(id) not null, -- Fixed: Changed text to uuid
  quantity integer not null,
  size jsonb not null,
  addons jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for cart_items
alter table public.cart_items enable row level security;

-- Policies for cart_items
create policy "Users can view their own cart items"
  on public.cart_items for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own cart items"
  on public.cart_items for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own cart items"
  on public.cart_items for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own cart items"
  on public.cart_items for delete
  using ( auth.uid() = user_id );

-- Create coupons table
create table public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  value numeric not null,
  expiration_date timestamp with time zone,
  usage_limit integer,
  usage_count integer default 0,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for coupons
alter table public.coupons enable row level security;

-- Policies for Coupons
create policy "Coupons are viewable by everyone"
  on public.coupons for select
  using ( true );

create policy "Admins can insert coupons"
    on public.coupons for insert
    with check (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Admins can update coupons"
    on public.coupons for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

create policy "Admins can delete coupons"
    on public.coupons for delete
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Add coupon columns to orders
-- Note: This is DDL for existing table, might fail if run as full script in some environments,
-- but fine for reference. User will run specific alter command.
-- alter table public.orders add column coupon_code text;
-- alter table public.orders add column discount_amount numeric default 0;
