/**
 * Checkout is initiated client-side using swell.cart.checkout().
 * You can move logic here to embed checkout with server tokens if needed.
 */
export async function POST() {
  return new Response(JSON.stringify({ note: 'Client starts checkout via swell.cart.checkout()' }), { status: 200 });
}
