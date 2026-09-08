// src/app/api/webhooks/stripe/route.js
// Source of truth for order creation. An order (and its order_items) is
// only ever written here, in response to a verified payment_intent.succeeded
// event — never from client-side code reacting to a successful
// confirmPayment() call, since that can lie or the tab can close before it
// resolves. Idempotent on stripe_payment_intent_id: Stripe retries webhook
// deliveries, so this must be safe to run twice for the same PaymentIntent.
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createOrderFromWebhook, getOrderByPaymentIntentId, markOrderRefunded } from '@/lib/supabase'

export const runtime = 'nodejs'

function parseItemsFromMetadata(metadata) {
  try {
    const raw = JSON.parse(metadata.items || '[]')
    return raw.map((i) => ({
      variantId: i.v,
      name: i.n,
      size: i.s,
      priceCents: i.p,
      qty: i.q,
    }))
  } catch {
    return []
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  const existing = await getOrderByPaymentIntentId(paymentIntent.id)
  if (existing) return // already processed — Stripe retried the delivery

  const items = parseItemsFromMetadata(paymentIntent.metadata ?? {})
  if (!items.length) {
    console.error('[webhooks/stripe] payment_intent.succeeded with no items in metadata', paymentIntent.id)
    return
  }

  const md = paymentIntent.metadata
  await createOrderFromWebhook({
    order: {
      stripe_payment_intent_id: paymentIntent.id,
      email: md.email,
      name: md.name,
      shipping_address: {
        address1: md.address_line1,
        address2: md.address_line2 || null,
        city: md.address_city,
        state: md.address_state || null,
        zip: md.address_zip,
        country: md.address_country,
      },
      shipping_carrier: md.shipping_carrier || null,
      shipping_service: md.shipping_service || null,
      shipping_cost_cents: Number(md.shipping_cost_cents) || 0,
      subtotal_cents: Number(md.subtotal_cents) || 0,
      total_cents: paymentIntent.amount,
      status: 'paid',
    },
    items,
  })
}

export async function POST(req) {
  const stripe = getStripe()
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const rawBody = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('[webhooks/stripe] signature verification failed', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        console.warn('[webhooks/stripe] payment failed', event.data.object.id)
        break
      case 'charge.refunded': {
        const charge = event.data.object
        if (charge.payment_intent) await markOrderRefunded(charge.payment_intent)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error(`[webhooks/stripe] failed to handle ${event.type}`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
