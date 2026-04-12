// src/app/api/lead/route.js
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req) {
  try {
    const { name = '', email = '', phone = '', ts = Date.now() } = await req.json().catch(() => ({}));

    const cleanName  = String(name  || '').trim();
    const cleanEmail = String(email || '').trim();
    const cleanPhone = String(phone || '').trim();

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json({ ok: false, error: 'empty' }, { status: 400 });
    }

    const payload = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      ts,
      ua: req.headers.get('user-agent') || '',
      ip: req.headers.get('x-forwarded-for') || '',
    };

    // ── Resend email notification ──────────────────────────────────────────
    const resendKey = process.env.RESEND_API_KEY;
    const notifyTo  = process.env.NOTIFY_EMAIL; // your email address

    if (resendKey && notifyTo) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: 'lameboy <onboarding@resend.dev>',
        to: notifyTo,
        subject: `New subscriber: ${cleanName || cleanEmail || cleanPhone}`,
        html: `
          <p><strong>Name:</strong> ${cleanName || '—'}</p>
          <p><strong>Email:</strong> ${cleanEmail || '—'}</p>
          <p><strong>Phone:</strong> ${cleanPhone || '—'}</p>
          <hr/>
          <p style="color:#888;font-size:12px">
            Submitted at ${new Date(ts).toUTCString()}<br/>
            IP: ${payload.ip}<br/>
            UA: ${payload.ua}
          </p>
        `,
      }).catch((err) => console.error('[lead] resend error', err));
    }

    // ── Optional legacy webhook ────────────────────────────────────────────
    const hook = process.env.LEAD_WEBHOOK_URL;
    if (hook) {
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      }).catch(() => {});
    }

    if (!resendKey && !hook) {
      console.log('[lead]', payload);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[lead]', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
