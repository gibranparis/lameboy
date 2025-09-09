// src/app/api/revalidate/route.js
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

// Utility to log minimal info
function logEvent(info) {
  try {
    console.log('[revalidate]', JSON.stringify(info));
  } catch {}
}

async function findSlugFromPayload(payload) {
  const record = payload?.record || payload?.data || {};
  // Common places slug/id may appear
  const slug =
    record?.slug ||
    record?.product?.slug ||
    record?.parent?.slug ||
    payload?.slug ||
    null;

  if (slug && typeof slug === 'string') return slug;

  // Fallback: if an id is present, you could fetch from Swell here
  // const id = record?.id || payload?.id || null;
  // if (id) {
  //   const p = await swell.products.get(id);
  //   return p?.slug || null;
  // }

  return null;
}

export async function POST(req) {
  const ip = headers().get('x-forwarded-for') || headers().get('x-real-ip') || '';
  const token = req.headers.get('x-revalidate-token') || new URL(req.url).searchParams.get('token');
  if (token !== process.env.REVALIDATE_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid token' }), { status: 401 });
  }

  let payload = {};
  try {
    payload = await req.json();
  } catch {}

  const slug = await findSlugFromPayload(payload);
  const paths = new Set(['/shop']); // always revalidate the listing

  if (slug) {
    paths.add(`/shop/${slug}`);
  }

  for (const p of paths) {
    revalidatePath(p);
    logEvent({ method: 'POST', slug: p, ip });
  }

  return Response.json({ ok: true, paths: Array.from(paths) });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const path = searchParams.get('path') || searchParams.get('slug');

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
