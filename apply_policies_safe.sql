-- Drop policies if they exist to avoid errors
drop policy if exists "Admins can view all orders" on public.orders;
drop policy if exists "Admins can update all orders" on public.orders;
drop policy if exists "Admins can view all order items" on public.order_items;

-- Re-create the policies consistently

-- 1. Permitir a los admins ver todos los pedidos
create policy "Admins can view all orders"
    on public.orders for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- 2. Permitir a los admins actualizar pedidos (cambiar estatus)
create policy "Admins can update all orders"
    on public.orders for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- 3. Permitir a los admins ver los items de los pedidos
create policy "Admins can view all order items"
    on public.order_items for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );
