export const runtime = 'edge';

import { NextResponse } from 'next/server';

export function GET(req) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? url.searchParams.get('preview');
  const ok = token && token === (process.env.MAINTENANCE_BYPASS_TOKEN ?? '');

  const res = NextResponse.redirect(new URL('/', req.url), { status: 303 });

  if (ok) {
    // 1 hour bypass, httpOnly for safety, sameSite strict
    res.cookies.set('bypass_maintenance', '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60,
    });
  }

  return res;
}
