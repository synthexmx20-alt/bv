-- Notify the external Meta CAPI listener when an order status changes.
create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if old.status is distinct from new.status then
    perform pg_notify(
      'meta_capi_orders',
      json_build_object(
        'id', new.id,
        'status', new.status,
        'total_amount', new.total_amount,
        'shipping_details', new.shipping_details
      )::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists orders_status_change_trigger on public.orders;
create trigger orders_status_change_trigger
  after update on public.orders
  for each row
  execute function public.notify_order_status_change();
