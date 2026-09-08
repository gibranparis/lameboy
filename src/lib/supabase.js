// src/lib/supabase.js
// Server-only Supabase access. Uses the service role key, so this file must
// never be imported from a 'use client' component — only from route
// handlers (src/app/api/**) which run on the server.
import { createClient } from '@supabase/supabase-js'

let adminClient = null

export function getSupabaseAdmin() {
  if (!adminClient) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set')
    adminClient = createClient(url, key, { auth: { persistSession: false } })
  }
  return adminClient
}

/** All products with their variants, active-first. */
export async function listProductsWithVariants() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, description, category, variants(id, size, color, stock, price_cents, weight_oz, length_in, width_in, height_in)')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** Variants by id, keyed for quick lookup. Used to price/weigh a cart server-side. */
export async function getVariantsByIds(variantIds) {
  if (!variantIds?.length) return new Map()
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('variants')
    .select('id, product_id, size, color, stock, price_cents, weight_oz, length_in, width_in, height_in, products(name)')
    .in('id', variantIds)

  if (error) throw error
  return new Map((data ?? []).map((v) => [v.id, v]))
}

/** Look up an existing order by its Stripe PaymentIntent id (idempotency check + status lookup). */
export async function getOrderByPaymentIntentId(paymentIntentId) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('orders')
    .select('id, stripe_payment_intent_id, email, name, shipping_address, shipping_carrier, shipping_service, shipping_cost_cents, subtotal_cents, total_cents, status, created_at, order_items(id, name_snapshot, size_snapshot, price_cents, qty)')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Insert the order + its line items and decrement stock — as one Postgres
 * transaction via create_order_with_stock_decrement(), so a stock shortfall
 * on any item rolls back the whole order instead of leaving a paid order
 * behind with an understated (or double-decremented, on webhook retry)
 * stock count. Webhook-only.
 */
export async function createOrderFromWebhook({ order, items }) {
  const supabase = getSupabaseAdmin()

  const { data: orderId, error } = await supabase.rpc('create_order_with_stock_decrement', {
    p_order: order,
    p_items: items.map((item) => ({
      variant_id: item.variantId,
      name_snapshot: item.name,
      size_snapshot: item.size,
      price_cents: item.priceCents,
      qty: item.qty,
    })),
  })
  if (error) throw error

  return orderId
}

/** Mark an order refunded (triggered by the charge.refunded webhook event). */
export async function markOrderRefunded(paymentIntentId) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('orders')
    .update({ status: 'refunded' })
    .eq('stripe_payment_intent_id', paymentIntentId)
  if (error) throw error
}
