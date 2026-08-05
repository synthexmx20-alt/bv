begin;

drop policy if exists "Enable delete access for authenticated users" on public.orders;
drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Users can update own orders" on public.orders;
drop policy if exists "Users can insert own order items" on public.order_items;
drop policy if exists "Coupons are viewable by everyone" on public.coupons;
drop policy if exists "Enable write access for authenticated users" on public.addons;
drop policy if exists "Enable write access for authenticated users" on public.site_settings;
drop policy if exists "Allow public insert and update to unique_visitors" on public.unique_visitors;
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;

drop policy if exists "Admins can manage addons" on public.addons;
create policy "Admins can manage addons"
on public.addons for all to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings for all to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- The admin UI creates manual CRM orders and must remain operational.
drop policy if exists "Admins can insert orders" on public.orders;
create policy "Admins can insert orders"
on public.orders for insert to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
on public.orders for delete to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can insert order items" on public.order_items;
create policy "Admins can insert order items"
on public.order_items for insert to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

do $$
begin
  if to_regprocedure('public.confirm_order_payment(uuid,text)') is not null then
    execute 'revoke execute on function public.confirm_order_payment(uuid, text) from public, anon, authenticated';
  end if;
end;
$$;
drop function if exists public.confirm_order_payment(uuid, text);

commit;
