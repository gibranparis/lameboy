// src/app/api/lead/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email = '', phone = '', ts = Date.now() } = await req.json().catch(() => ({}));

    // very light validation
    const cleanEmail = String(email || '').trim();
    const cleanPhone = String(phone || '').trim();
    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json({ ok: false, error: 'empty' }, { status: 400 });
    }

    const payload = {
      email: cleanEmail,
      phone: cleanPhone,
      ts,
      ua: req.headers.get('user-agent') || '',
      ip: req.headers.get('x-forwarded-for') || '',
    };

    const hook = process.env.LEAD_WEBHOOK_URL;
    if (hook) {
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      }).catch(() => {});
    } else {
      // no webhook configured: log and succeed
      console.log('[lead]', payload);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
