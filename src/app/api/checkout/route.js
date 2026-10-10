// src/app/api/checkout/route.js
// Creates the PaymentIntent at Pay time (the checkout page runs Stripe
// Elements in deferred-intent mode, so nothing exists until the customer
// pays — by card or via Apple Pay / Google Pay / Link). Never trusts client-sent prices: item prices come from
// Supabase and the shipping cost comes from re-fetching the chosen Shippo
// rate by id. Nothing is written to the `orders` table here — that only
// ever happens in the payment_intent.succeeded webhook, so the cart + address
// this request validated is carried forward as PaymentIntent metadata for
// the webhook to read back. The address in metadata is the full one sent
// here — express-checkout rates are quoted from a partial wallet address,
// so nothing downstream should read the address off the Shippo shipment.
import { NextResponse } from 'next/server'
import { getVariantsByIds } from '@/lib/supabase'
import { getRateById } from '@/lib/shippo'
import { getStripe } from '@/lib/stripe'
import { encodeItems } from '@/lib/order-metadata'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email, name, phone, address, items, rateId } = body ?? {}

    if (!email || !name) {
      return NextResponse.json({ error: 'Contact info is required' }, { status: 400 })
    }
    if (!address?.address1 || !address?.city || !address?.zip || !address?.country) {
      return NextResponse.json({ error: 'A complete shipping address is required' }, { status: 400 })
    }
    if (!Array.isArray(items) || !items.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }
    if (!rateId) {
      return NextResponse.json({ error: 'Please select a shipping method' }, { status: 400 })
    }

    const variantIds = items.map((i) => i.variantId).filter(Boolean)
    const variantsById = await getVariantsByIds(variantIds)

    const lineItems = []
    let subtotalCents = 0
    for (const item of items) {
      const variant = variantsById.get(item.variantId)
      if (!variant) {
        return NextResponse.json({ error: 'One of the items in your cart is no longer available' }, { status: 400 })
      }
      const qty = Math.max(1, Number(item.qty) || 1)
      if (variant.stock < qty) {
        return NextResponse.json({ error: `Not enough stock for ${variant.products?.name ?? 'an item'}` }, { status: 400 })
      }
      subtotalCents += variant.price_cents * qty
      lineItems.push({
        v: variant.id,
        n: variant.products?.name ?? '',
        s: variant.size,
        p: variant.price_cents,
        q: qty,
      })
    }

    const rate = await getRateById(rateId)
    const totalCents = subtotalCents + rate.price

    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      receipt_email: email,
      payment_method_types: ['card', 'link'],
      shipping: {
        name,
        phone: phone || undefined,
        address: {
          line1: address.address1,
          line2: address.address2 || '',
          city: address.city,
          state: address.state || '',
          postal_code: address.zip,
          country: address.country,
        },
      },
      metadata: {
        email,
        name,
        phone: phone || '',
        address_line1: address.address1,
        address_line2: address.address2 || '',
        address_city: address.city,
        address_state: address.state || '',
        address_zip: address.zip,
        address_country: address.country,
        shipping_carrier: rate.provider,
        shipping_service: rate.name,
        shipping_cost_cents: String(rate.price),
        subtotal_cents: String(subtotalCents),
        ...encodeItems(lineItems),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      totalCents,
      subtotalCents,
      shippingCents: rate.price,
    })
  } catch (err) {
    console.error('[api/checkout]', err)
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 })
  }
}
