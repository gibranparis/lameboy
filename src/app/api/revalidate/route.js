// src/app/api/revalidate/route.js
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

// If you have a Swell client on the server, uncomment and configure to look up products by id
// import swell from '@/lib/swell';

async function findSlugFromPayload(payload) {
  const record = payload?.record || payload?.data || {};
  // Common places slug/id may appear
  const slug =
    record?.slug ||
    record?.product?.slug ||
    record?.parent?.slug ||
    payload?.slug ||
    null;

  if (slug) return slug;

  // Try to resolve from ids if available (variant/product)
  const productId = record?.product_id || record?.id || record?.product?.id;
  // If you can do server-side Swell calls, fetch slug:
  // if (productId) {
  //   try {
  //     const p = await swell.products.get(productId, { expand: ['variants'] });
  //     if (p?.slug) return p.slug;
  //   } catch {}
  // }
  return null;
}

function logEvent({ method, type, slug, ip }) {
  // lightweight console log for observability
  console.log(`[revalidate] ${method} type=${type || 'unknown'} slug=${slug || '-'} ip=${ip || '-'}`);
}

export async function POST(req) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (token !== process.env.REVALIDATE_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid token' }), { status: 401 });
  }

  let payload = {};
  try {
    payload = await req.json();
  } catch { /* some webhooks omit body */ }

  const type = payload?.type || 'unknown';
  const ip = headers().get('x-forwarded-for') || headers().get('x-real-ip') || '';

  // Always revalidate the grid (useful for price/name/stock changes)
  revalidatePath('/shop');

  // Try to revalidate a specific product page
  const slug = await findSlugFromPayload(payload);
  if (slug) revalidatePath(`/shop/${slug}`);

  logEvent({ method: 'POST', type, slug, ip });
  return Response.json({ ok: true, type, slug, paths: ['/shop', slug ? `/shop/${slug}` : null].filter(Boolean) });
}

// Manual ping: /api/revalidate?path=/shop/my-product&token=...
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const path = searchParams.get('path');

  if (token !== process.env.REVALIDATE_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid token' }), { status: 401 });
  }
  if (!path) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing path' }), { status: 400 });
  }

  revalidatePath(path);
  const ip = headers().get('x-forwarded-for') || headers().get('x-real-ip') || '';
  logEvent({ method: 'GET', type: 'manual', slug: path, ip });

  return Response.json({ ok: true, path });
}
