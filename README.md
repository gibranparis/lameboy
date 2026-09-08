# LAMEBOY — Next.js + Stripe + Supabase + Shippo

Run locally:
```bash
npm install
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000 then test `/shop` and `/checkout`.

To exercise the checkout webhook locally, run the Stripe CLI alongside `next dev`:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

Run `schema.sql` and `create_order_with_stock_decrement_function.sql` against a fresh Supabase project before testing checkout — they create the `products`/`variants`/`orders`/`order_items` tables and the atomic order-creation + stock-decrement RPC the webhook calls.

Deploy to Vercel and add the same env vars there, plus a production webhook endpoint in the Stripe dashboard pointed at `/api/webhooks/stripe`.
