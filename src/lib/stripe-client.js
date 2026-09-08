// src/lib/stripe-client.js
// Browser-safe Stripe helper — @stripe/stripe-js only ever loads Stripe.js
// via a <script> tag, so this is fine to import from 'use client' components.
'use client'

import { loadStripe } from '@stripe/stripe-js'

let stripePromise = null

export function getStripePromise() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
      return null
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}
