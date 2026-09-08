-- decrement_stock_function.sql
-- Atomic stock decrement, called once per order from the Stripe webhook
-- handler after order + order_items are inserted. Runs as a single
-- plpgsql function invocation so all line items succeed or fail together —
-- if any variant doesn't have enough stock, the whole call rolls back.

create or replace function decrement_stock_for_order(p_items jsonb)
returns void
language plpgsql
security definer
as $$
declare
  item jsonb;
  updated_rows integer;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    update variants
    set stock = stock - (item->>'qty')::integer
    where id = (item->>'variant_id')::uuid
      and stock >= (item->>'qty')::integer;

    get diagnostics updated_rows = row_count;

    if updated_rows = 0 then
      raise exception 'Insufficient stock for variant %', item->>'variant_id';
    end if;
  end loop;
end;
$$;
