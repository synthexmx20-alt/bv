-- Enable RLS on orders table
alter table public.orders enable row level security;

-- 1. Allow Users to View their own orders
-- (Drop if exists to avoid errors)
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
on public.orders for select
using ( auth.uid() = user_id );

-- 2. Allow Users to Insert their own orders
drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
on public.orders for insert
with check ( auth.uid() = user_id );

-- 3. CRITICAL: Allow Users to Update their own orders (needed for payment confirmation)
drop policy if exists "Users can update own orders" on public.orders;
create policy "Users can update own orders"
on public.orders for update
using ( auth.uid() = user_id );
