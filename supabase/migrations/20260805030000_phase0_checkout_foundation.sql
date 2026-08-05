-- Phase 0: additive checkout foundations. Browser write policies are removed only
-- in the post-cutover restriction migration.

alter table public.orders
  add column if not exists checkout_attempt_id uuid,
  add column if not exists payment_method text,
  add column if not exists payment_preference_id text,
  add column if not exists payment_init_point text,
  add column if not exists payment_currency text default 'MXN',
  add column if not exists payment_amount numeric(12, 2),
  add column if not exists paid_at timestamptz,
  add column if not exists confirmation_email_sent_at timestamptz;

create unique index if not exists orders_user_checkout_attempt_uidx
  on public.orders (user_id, checkout_attempt_id)
  where checkout_attempt_id is not null;

create unique index if not exists orders_payment_id_uidx
  on public.orders (payment_id)
  where payment_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_payment_method_check'
  ) then
    alter table public.orders
      add constraint orders_payment_method_check
      check (payment_method is null or payment_method in ('card', 'spei')) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_checkout_attempt_user_check'
  ) then
    alter table public.orders
      add constraint orders_checkout_attempt_user_check
      check (checkout_attempt_id is null or user_id is not null) not valid;
  end if;
end;
$$;

create or replace function public.create_checkout_order(
  p_user_id uuid,
  p_checkout_attempt_id uuid,
  p_payment_method text,
  p_total_amount numeric,
  p_shipping_details jsonb,
  p_message_details jsonb,
  p_coupon_code text,
  p_discount_amount numeric,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_existing public.orders%rowtype;
  v_coupon public.coupons%rowtype;
  v_order_id uuid;
  v_status text;
  v_item_count integer;
  v_subtotal numeric(12, 2);
  v_shipping numeric(12, 2);
  v_expected_discount numeric(12, 2);
begin
  if p_user_id is null or not exists (
    select 1 from public.profiles where id = p_user_id
  ) then
    raise exception using errcode = '22023', message = 'CHECKOUT_USER_INVALID';
  end if;

  if p_checkout_attempt_id is null then
    raise exception using errcode = '22023', message = 'CHECKOUT_ATTEMPT_INVALID';
  end if;

  if p_payment_method not in ('card', 'spei') then
    raise exception using errcode = '22023', message = 'PAYMENT_METHOD_INVALID';
  end if;

  if p_total_amount is null
    or p_total_amount <= 0
    or round(p_total_amount, 2) <> p_total_amount then
    raise exception using errcode = '22023', message = 'CHECKOUT_TOTAL_INVALID';
  end if;

  if p_discount_amount is null
    or p_discount_amount < 0
    or round(p_discount_amount, 2) <> p_discount_amount then
    raise exception using errcode = '22023', message = 'CHECKOUT_DISCOUNT_INVALID';
  end if;

  if jsonb_typeof(p_shipping_details) <> 'object'
    or jsonb_typeof(p_message_details) <> 'object'
    or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = '22023', message = 'CHECKOUT_PAYLOAD_INVALID';
  end if;

  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 20 then
    raise exception using errcode = '22023', message = 'CHECKOUT_ITEMS_INVALID';
  end if;

  select *
  into v_existing
  from public.orders
  where user_id = p_user_id
    and checkout_attempt_id = p_checkout_attempt_id
  for update;

  if found then
    return jsonb_build_object(
      'order_id', v_existing.id,
      'created', false,
      'status', v_existing.status,
      'total_amount', v_existing.total_amount,
      'discount_amount', coalesce(v_existing.discount_amount, 0),
      'shipping_amount', coalesce((v_existing.shipping_details ->> 'cost')::numeric, 0),
      'payment_method', v_existing.payment_method,
      'payment_preference_id', v_existing.payment_preference_id,
      'payment_init_point', v_existing.payment_init_point
    );
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as item(value)
    where jsonb_typeof(item.value) <> 'object'
      or coalesce(item.value ->> 'product_id', '') = ''
      or coalesce(item.value ->> 'product_name', '') = ''
      or coalesce(item.value ->> 'size', '') = ''
      or coalesce(item.value ->> 'quantity', '') !~ '^\d+$'
      or (item.value ->> 'quantity')::integer not between 1 and 20
      or coalesce(item.value ->> 'price', '') !~ '^\d+(\.\d{1,2})?$'
      or (item.value ->> 'price')::numeric < 0
      or jsonb_typeof(coalesce(item.value -> 'addons', '[]'::jsonb)) <> 'array'
  ) then
    raise exception using errcode = '22023', message = 'CHECKOUT_ITEM_SNAPSHOT_INVALID';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as item(value)
    cross join lateral jsonb_array_elements(coalesce(item.value -> 'addons', '[]'::jsonb)) as addon(value)
    where jsonb_typeof(addon.value) <> 'object'
      or coalesce(addon.value ->> 'id', '') = ''
      or coalesce(addon.value ->> 'name', '') = ''
      or coalesce(addon.value ->> 'price', '') !~ '^\d+(\.\d{1,2})?$'
      or (addon.value ->> 'price')::numeric < 0
  ) then
    raise exception using errcode = '22023', message = 'CHECKOUT_ADDON_SNAPSHOT_INVALID';
  end if;

  select round(coalesce(sum(
    (
      (item.value ->> 'price')::numeric
      + coalesce((
        select sum((addon.value ->> 'price')::numeric)
        from jsonb_array_elements(coalesce(item.value -> 'addons', '[]'::jsonb)) as addon(value)
      ), 0)
    ) * (item.value ->> 'quantity')::integer
  ), 0), 2)
  into v_subtotal
  from jsonb_array_elements(p_items) as item(value);

  begin
    v_shipping := round(coalesce(nullif(p_shipping_details ->> 'cost', '')::numeric, 0), 2);
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'SHIPPING_AMOUNT_INVALID';
  end;

  if v_shipping < 0 then
    raise exception using errcode = '22023', message = 'SHIPPING_AMOUNT_INVALID';
  end if;

  if nullif(trim(p_coupon_code), '') is null then
    if p_discount_amount <> 0 then
      raise exception using errcode = '22023', message = 'COUPON_REQUIRED_FOR_DISCOUNT';
    end if;
  else
    select *
    into v_coupon
    from public.coupons
    where upper(code) = upper(trim(p_coupon_code))
    for update;

    if not found or not v_coupon.active then
      raise exception using errcode = '22023', message = 'COUPON_INVALID';
    end if;

    if v_coupon.expiration_date is not null and v_coupon.expiration_date < now() then
      raise exception using errcode = '22023', message = 'COUPON_EXPIRED';
    end if;

    if v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit then
      raise exception using errcode = '22023', message = 'COUPON_EXHAUSTED';
    end if;

    if v_coupon.discount_type = 'percentage' then
      if v_coupon.value <= 0 or v_coupon.value > 100 then
        raise exception using errcode = '22023', message = 'COUPON_VALUE_INVALID';
      end if;
      v_expected_discount := least(floor(v_subtotal * v_coupon.value) / 100, v_subtotal);
    elsif v_coupon.discount_type = 'fixed' then
      if v_coupon.value < 0 then
        raise exception using errcode = '22023', message = 'COUPON_VALUE_INVALID';
      end if;
      v_expected_discount := least(round(v_coupon.value, 2), v_subtotal);
    else
      raise exception using errcode = '22023', message = 'COUPON_TYPE_INVALID';
    end if;

    if v_expected_discount <> p_discount_amount then
      raise exception using errcode = '22023', message = 'COUPON_DISCOUNT_MISMATCH';
    end if;
  end if;

  if round(v_subtotal + v_shipping - p_discount_amount, 2) <> p_total_amount then
    raise exception using errcode = '22023', message = 'CHECKOUT_TOTAL_MISMATCH';
  end if;

  v_status := case
    when p_payment_method = 'spei' then 'pending_transfer'
    else 'pending_payment'
  end;

  insert into public.orders (
    user_id,
    total_amount,
    status,
    shipping_details,
    message_details,
    coupon_code,
    discount_amount,
    checkout_attempt_id,
    payment_method,
    payment_currency
  ) values (
    p_user_id,
    p_total_amount,
    v_status,
    p_shipping_details,
    p_message_details,
    case when v_coupon.id is null then null else v_coupon.code end,
    p_discount_amount,
    p_checkout_attempt_id,
    p_payment_method,
    'MXN'
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    quantity,
    price,
    size,
    addons
  )
  select
    v_order_id,
    item.value ->> 'product_id',
    item.value ->> 'product_name',
    (item.value ->> 'quantity')::integer,
    (item.value ->> 'price')::numeric,
    item.value ->> 'size',
    coalesce(item.value -> 'addons', '[]'::jsonb)
  from jsonb_array_elements(p_items) as item(value);

  if v_coupon.id is not null then
    update public.coupons
    set usage_count = usage_count + 1
    where id = v_coupon.id;
  end if;

  return jsonb_build_object(
    'order_id', v_order_id,
    'created', true,
    'status', v_status,
    'total_amount', p_total_amount,
    'discount_amount', p_discount_amount,
    'shipping_amount', v_shipping,
    'payment_method', p_payment_method,
    'payment_preference_id', null,
    'payment_init_point', null
  );
end;
$$;

revoke all on function public.create_checkout_order(
  uuid, uuid, text, numeric, jsonb, jsonb, text, numeric, jsonb
) from public, anon, authenticated;
grant execute on function public.create_checkout_order(
  uuid, uuid, text, numeric, jsonb, jsonb, text, numeric, jsonb
) to service_role;

create or replace function public.confirm_checkout_payment(
  p_order_id uuid,
  p_payment_id text,
  p_amount numeric,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_order_id is null or nullif(trim(p_payment_id), '') is null then
    raise exception using errcode = '22023', message = 'PAYMENT_REFERENCE_INVALID';
  end if;

  if upper(coalesce(p_currency, '')) <> 'MXN' then
    raise exception using errcode = '22023', message = 'PAYMENT_CURRENCY_MISMATCH';
  end if;

  if p_amount is null or p_amount <= 0 or round(p_amount, 2) <> p_amount then
    raise exception using errcode = '22023', message = 'PAYMENT_AMOUNT_INVALID';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'ORDER_NOT_FOUND';
  end if;

  if round(v_order.total_amount, 2) <> p_amount then
    raise exception using errcode = '22023', message = 'PAYMENT_AMOUNT_MISMATCH';
  end if;

  if v_order.status = 'confirmed' and v_order.payment_id = trim(p_payment_id) then
    return jsonb_build_object(
      'order_id', v_order.id,
      'transitioned', false,
      'status', v_order.status
    );
  end if;

  if v_order.payment_id is not null and v_order.payment_id <> trim(p_payment_id) then
    raise exception using errcode = '23505', message = 'PAYMENT_ID_CONFLICT';
  end if;

  if v_order.status <> 'pending_payment' then
    raise exception using errcode = '22023', message = 'ORDER_NOT_AWAITING_CARD_PAYMENT';
  end if;

  update public.orders
  set status = 'confirmed',
      payment_id = trim(p_payment_id),
      payment_amount = p_amount,
      payment_currency = 'MXN',
      paid_at = now()
  where id = v_order.id;

  return jsonb_build_object(
    'order_id', v_order.id,
    'transitioned', true,
    'status', 'confirmed'
  );
end;
$$;

revoke all on function public.confirm_checkout_payment(uuid, text, numeric, text)
  from public, anon, authenticated;
grant execute on function public.confirm_checkout_payment(uuid, text, numeric, text)
  to service_role;

comment on function public.create_checkout_order(
  uuid, uuid, text, numeric, jsonb, jsonb, text, numeric, jsonb
) is 'Creates an authenticated storefront order from a server-validated quote.';

comment on function public.confirm_checkout_payment(uuid, text, numeric, text)
  is 'Confirms an exact MXN card payment after Mercado Pago verification.';
