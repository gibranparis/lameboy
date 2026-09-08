// src/lib/stripe.js
// Server-only Stripe SDK client. Must only be imported from route handlers
// (src/app/api/**) — never from a 'use client' component. For the browser
// side (Payment Element / confirmPayment), see src/lib/stripe-client.js.
import Stripe from 'stripe'

let stripeClient = null

export function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    stripeClient = new Stripe(key, { apiVersion: '2024-06-20' })
  }
  return stripeClient
}
