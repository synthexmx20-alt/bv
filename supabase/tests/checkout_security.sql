begin;

create schema if not exists extensions;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

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

select extensions.plan(16);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.create_checkout_order(uuid,uuid,text,numeric,jsonb,jsonb,text,numeric,jsonb)',
    'execute'
  ),
  'anon cannot create checkout orders through the private RPC'
);

select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'public.create_checkout_order(uuid,uuid,text,numeric,jsonb,jsonb,text,numeric,jsonb)',
    'execute'
  ),
  'authenticated cannot invoke the checkout RPC directly'
);

select extensions.ok(
  has_function_privilege(
    'service_role',
    'public.create_checkout_order(uuid,uuid,text,numeric,jsonb,jsonb,text,numeric,jsonb)',
    'execute'
  ),
  'service role can create checkout orders'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.confirm_checkout_payment(uuid,text,numeric,text)',
    'execute'
  ),
  'anon cannot confirm checkout payments'
);

select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'public.confirm_checkout_payment(uuid,text,numeric,text)',
    'execute'
  ),
  'authenticated cannot confirm checkout payments'
);

select extensions.ok(
  has_function_privilege(
    'service_role',
    'public.confirm_checkout_payment(uuid,text,numeric,text)',
    'execute'
  ),
  'service role can confirm checkout payments'
);

insert into public.profiles (id, full_name, role)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Prueba Checkout', 'customer');

insert into public.coupons (
  id,
  code,
  discount_type,
  value,
  usage_limit,
  usage_count,
  active
) values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'AMOR10',
  'percentage',
  10,
  5,
  0,
  true
);

create temporary table first_checkout_result as
select public.create_checkout_order(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'card',
  1130,
  '{"fullName":"Prueba","cost":50}'::jsonb,
  '{"withoutNote":true}'::jsonb,
  'AMOR10',
  120,
  '[{"product_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","product_name":"Rosas","quantity":2,"price":500,"size":"Estándar","addons":[{"id":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","name":"Chocolates","type":"extra","price":100}]}]'::jsonb
) as result;

select extensions.is(
  (select result ->> 'created' from first_checkout_result),
  'true',
  'the first checkout attempt creates an order'
);

select extensions.is(
  (select count(*)::text from public.orders),
  '1',
  'the checkout creates exactly one order'
);

select extensions.is(
  (select count(*)::text from public.order_items),
  '1',
  'the checkout creates its item snapshot atomically'
);

select extensions.is(
  (select usage_count::text from public.coupons where code = 'AMOR10'),
  '1',
  'coupon usage is reserved once'
);

create temporary table retry_checkout_result as
select public.create_checkout_order(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'card',
  1130,
  '{"fullName":"Prueba","cost":50}'::jsonb,
  '{"withoutNote":true}'::jsonb,
  'AMOR10',
  120,
  '[{"product_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","product_name":"Rosas","quantity":2,"price":500,"size":"Estándar","addons":[{"id":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","name":"Chocolates","type":"extra","price":100}]}]'::jsonb
) as result;

select extensions.is(
  (select result ->> 'created' from retry_checkout_result),
  'false',
  'reusing the checkout attempt returns the existing order'
);

select extensions.is(
  (select usage_count::text from public.coupons where code = 'AMOR10'),
  '1',
  'an idempotent retry does not consume the coupon twice'
);

select extensions.throws_ok(
  format(
    'select public.confirm_checkout_payment(%L, %L, 1129, %L)',
    (select result ->> 'order_id' from first_checkout_result),
    'mp-wrong-amount',
    'MXN'
  ),
  '22023',
  'PAYMENT_AMOUNT_MISMATCH',
  'a mismatched payment amount is rejected'
);

create temporary table confirmation_result as
select public.confirm_checkout_payment(
  (select (result ->> 'order_id')::uuid from first_checkout_result),
  'mp-approved-1',
  1130,
  'MXN'
) as result;

select extensions.is(
  (select result ->> 'transitioned' from confirmation_result),
  'true',
  'the exact approved payment confirms the order'
);

select extensions.is(
  (select status from public.orders),
  'confirmed',
  'the confirmed state is persisted'
);

select extensions.is(
  (
    select public.confirm_checkout_payment(id, 'mp-approved-1', 1130, 'MXN') ->> 'transitioned'
    from public.orders
  ),
  'false',
  'a repeated webhook is idempotent'
);

select * from extensions.finish();

rollback;
