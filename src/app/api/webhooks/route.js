/**
 * Placeholder webhook endpoint — handle events like order.paid.
 * In Swell dashboard, point webhooks here: /api/webhooks
 */
export async function POST(req) {
  const body = await req.text();
  console.log('Webhook received:', body.slice(0, 500));
  return new Response('ok');
}
