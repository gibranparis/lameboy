// @ts-nocheck
export const runtime = 'edge'

import { NextResponse } from 'next/server'

/**
 * Accepts ?token= or ?preview=, sets a 1-hour httpOnly cookie to bypass maintenance,
 * then 303 redirects to home.
 */
export function GET(req) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') ?? url.searchParams.get('preview')
  const ok = token && token === (process.env.MAINTENANCE_BYPASS_TOKEN ?? '')

  const res = NextResponse.redirect(new URL('/', req.url), { status: 303 })

  if (ok) {
    res.cookies.set('bypass_maintenance', '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })
  }

  return res
}
