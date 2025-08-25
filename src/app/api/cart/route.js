/**
 * Cart is handled client-side via swell-js to preserve per-user sessions.
 * Extend this route if you want to proxy or add server-only logic.
 */
export async function GET() {
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
