-- create_order_with_stock_decrement_function.sql
-- Writes an order + its order_items and decrements variant stock as one
-- transaction, called once per order from the Stripe webhook handler
-- (payment_intent.succeeded). Everything here commits or rolls back
-- together: if any line item is out of stock, no order and no order_items
-- are left behind either — the webhook handler's catch block then returns
-- a 500, Stripe retries the delivery, and the idempotency check in
-- getOrderByPaymentIntentId() correctly finds nothing and retries the real
-- work instead of silently masking a half-written order with understated
-- stock.
--
-- p_order: { stripe_payment_intent_id, email, name, shipping_address,
--            shipping_carrier, shipping_service, shipping_cost_cents,
--            subtotal_cents, total_cents, status }
-- p_items: [{ variant_id, name_snapshot, size_snapshot, price_cents, qty }]

create or replace function create_order_with_stock_decrement(
  p_order jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  item jsonb;
  updated_rows integer;
begin
  insert into orders (
    stripe_payment_intent_id, email, name, shipping_address,
    shipping_carrier, shipping_service, shipping_cost_cents,
    subtotal_cents, total_cents, status
  )
  select
    p_order->>'stripe_payment_intent_id', p_order->>'email', p_order->>'name',
    p_order->'shipping_address', p_order->>'shipping_carrier', p_order->>'shipping_service',
    (p_order->>'shipping_cost_cents')::integer, (p_order->>'subtotal_cents')::integer,
    (p_order->>'total_cents')::integer, coalesce(p_order->>'status', 'paid')
  returning id into v_order_id;

  for item in select * from jsonb_array_elements(p_items)
  loop
    insert into order_items (order_id, variant_id, name_snapshot, size_snapshot, price_cents, qty)
    values (
      v_order_id, (item->>'variant_id')::uuid, item->>'name_snapshot',
      item->>'size_snapshot', (item->>'price_cents')::integer, (item->>'qty')::integer
    );

    if item->>'variant_id' is not null then
      update variants
      set stock = stock - (item->>'qty')::integer
      where id = (item->>'variant_id')::uuid
        and stock >= (item->>'qty')::integer;

      get diagnostics updated_rows = row_count;
      if updated_rows = 0 then
        raise exception 'Insufficient stock for variant %', item->>'variant_id';
      end if;
    end if;
  end loop;

  return v_order_id;
end;
$$;
