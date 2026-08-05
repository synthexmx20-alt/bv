-- 1. Check if payment_id column exists (Just for your info)
select column_name 
from information_schema.columns 
where table_name = 'orders';

-- 2. Add payment_id column if it doesn't exist
alter table public.orders 
add column if not exists payment_id text;

-- 3. Just in case, grant update permission again explicitly
grant update on public.orders to authenticated;
grant update on public.orders to anon;
