-- Create a secure function to update order status
-- This runs with "security definer" privileges, bypassing RLS checks for this specific operation
create or replace function confirm_order_payment(order_id_input uuid, payment_id_input text)
returns void
language plpgsql
security definer
as $$
begin
  update public.orders
  set status = 'confirmed',
      payment_id = payment_id_input
  where id = order_id_input;
end;
$$;

-- Grant permission to execute this function
grant execute on function confirm_order_payment to authenticated;
grant execute on function confirm_order_payment to anon;
