// src/app/api/shipping/rates/route.js
// Live shipping rates. Used by both the address step of checkout (full
// address) and the cart drawer's lightweight shipping estimate (just ZIP +
// country) — Shippo tolerates a partial "reference" address fine, it's just
// less accurate than a full one.
import { NextResponse } from 'next/server'
import { getVariantsByIds } from '@/lib/supabase'
import { getShippingRates } from '@/lib/shippo'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const destination = body?.destination
    const items = Array.isArray(body?.items) ? body.items : []

    if (!destination?.zip || !destination?.country) {
      return NextResponse.json({ error: 'A ZIP/postal code and country are required' }, { status: 400 })
    }
    // Only the real checkout flow (which always sends a full address) needs
    // a phone number for international destinations — the cart drawer's
    // ZIP-only estimate shouldn't force collecting one just for a preview.
    const isFullAddress = Boolean(destination.address1 && destination.city)
    if (isFullAddress && destination.country !== 'US' && !destination.phone) {
      return NextResponse.json({ error: 'A phone number is required for international shipping' }, { status: 400 })
    }
    if (!items.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const variantIds = items.map((i) => i.variantId).filter(Boolean)
    const variantsById = await getVariantsByIds(variantIds)

    const lines = items
      .map((item) => {
        const variant = variantsById.get(item.variantId)
        return variant ? { variant, qty: Math.max(1, Number(item.qty) || 1) } : null
      })
      .filter(Boolean)

    if (!lines.length) {
      return NextResponse.json({ error: 'No valid items in cart' }, { status: 400 })
    }

    const rates = await getShippingRates(destination, lines)
    if (!rates.length) {
      return NextResponse.json({ rates: [], error: 'No shipping rates available for this address' })
    }

    return NextResponse.json({ rates })
  } catch (err) {
    console.error('[api/shipping/rates]', err)
    return NextResponse.json({ error: 'Could not fetch shipping rates' }, { status: 500 })
  }
}
