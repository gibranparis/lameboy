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

      // ── Notify you ────────────────────────────────────────────────────────
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
      }).catch((err) => console.error('[lead] resend notify error', err));

      // ── Welcome email to subscriber ───────────────────────────────────────
      if (cleanEmail) {
        const firstName = cleanName ? cleanName.split(' ')[0] : null;
        const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
        await resend.emails.send({
          from: 'Lameboy <eden@lameboy.com>',
          to: cleanEmail,
          subject: 'Welcome to Lameboy',
          html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body {
    margin: 0; padding: 0;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #111;
  }
  .wrap {
    max-width: 480px;
    margin: 0 auto;
    padding: 48px 32px;
  }
  .rainbow {
    display: block;
    height: 3px;
    background: linear-gradient(90deg,
      #ef4444, #f97316, #facc15, #22c55e, #3b82f6, #4f46e5, #c084fc);
    margin-bottom: 40px;
    border-radius: 2px;
  }
  .logo {
    font-size: 18px;
    font-weight: 700;
    color: #111;
    margin-bottom: 28px;
    letter-spacing: -0.01em;
  }
  p {
    font-size: 15px;
    line-height: 1.7;
    color: #444;
    margin: 0 0 16px;
  }
  .footer {
    margin-top: 48px;
    font-size: 11px;
    color: #bbb;
  }
</style>
</head>
<body>
<div class="wrap">
  <span class="rainbow"></span>
  <div class="logo">LAMEBOY, USA &mdash; Florida</div>
  <p>welcome, ${firstName || 'friend'}.</p>
  <p>you're officially on the news list. we'll let you know when new drops land or something goes live.</p>
  <p>no spam.</p>
  <p>email <a href="mailto:Eden@lameboy.com" style="color:#111;">Eden@lameboy.com</a> for support.</p>
  <div class="footer">lameboy &mdash; let all mankind evolve</div>
</div>
</body>
</html>`,
        }).catch((err) => console.error('[lead] resend welcome error', err));
      }
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
