-- Emergency rollback only. Apply together with a rollback to the previous
-- Cloudflare frontend; this temporarily restores the legacy insecure flow.
begin;

drop policy if exists "Admins can manage addons" on public.addons;
drop policy if exists "Admins can manage site settings" on public.site_settings;
drop policy if exists "Admins can insert orders" on public.orders;
drop policy if exists "Admins can delete orders" on public.orders;
drop policy if exists "Admins can insert order items" on public.order_items;

create policy "Enable delete access for authenticated users"
on public.orders for delete using (auth.role() = 'authenticated');
create policy "Users can insert own orders"
on public.orders for insert with check (auth.uid() = user_id);
create policy "Users can update own orders"
on public.orders for update using (auth.uid() = user_id);
create policy "Users can insert own order items"
on public.order_items for insert with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id and orders.user_id = auth.uid()
  )
);
create policy "Coupons are viewable by everyone"
on public.coupons for select using (true);
create policy "Enable write access for authenticated users"
on public.addons for all using (auth.role() = 'authenticated');
create policy "Enable write access for authenticated users"
on public.site_settings for all using (auth.role() = 'authenticated');
create policy "Allow public insert and update to unique_visitors"
on public.unique_visitors for all using (true) with check (true);
create policy "Public profiles are viewable by everyone."
on public.profiles for select using (true);

create or replace function public.confirm_order_payment(order_id_input uuid, payment_id_input text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.orders
  set status = 'confirmed', payment_id = payment_id_input
  where id = order_id_input;
end;
$$;
grant execute on function public.confirm_order_payment(uuid, text) to anon, authenticated, service_role;

commit;
