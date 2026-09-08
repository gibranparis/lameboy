// src/app/api/orders/[payment_intent_id]/route.js
// Read-only order lookup. The confirmation step polls this after
// stripe.confirmPayment() resolves instead of assuming success client-side —
// the order only exists once the payment_intent.succeeded webhook has run.
import { NextResponse } from 'next/server'
import { getOrderByPaymentIntentId } from '@/lib/supabase'

export async function GET(_req, { params }) {
  const { payment_intent_id } = await params

  try {
    const order = await getOrderByPaymentIntentId(payment_intent_id)
    if (!order) {
      return NextResponse.json({ status: 'pending' }, { status: 404 })
    }

    return NextResponse.json({
      status: order.status,
      email: order.email,
      name: order.name,
      totalCents: order.total_cents,
      subtotalCents: order.subtotal_cents,
      shippingCents: order.shipping_cost_cents,
      items: order.order_items,
      createdAt: order.created_at,
    })
  } catch (err) {
    console.error('[api/orders]', err)
    return NextResponse.json({ error: 'Could not look up order' }, { status: 500 })
  }
}
