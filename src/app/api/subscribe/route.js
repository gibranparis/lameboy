// src/app/api/subscribe/route.js
import { NextResponse } from 'next/server';

const KLAVIYO_API = 'https://a.klaviyo.com/api/v2';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      email,
      phone,         // E.164 recommended: +1XXXXXXXXXX
      consentEmail,  // boolean
      consentSMS,    // boolean
      // context data
      utm = {},
      referrer,
      path,
      tzOffset,
      userAgent,
    } = body || {};

    if (!email && !phone) {
      return NextResponse.json({ ok: false, error: 'Email or phone required' }, { status: 400 });
    }

    const key = process.env.KLAVIYO_API_KEY;
    const listId = process.env.KLAVIYO_LIST_ID;

    // If keys are missing, store nothing but respond OK so your UI doesn’t break during local work
    if (!key || !listId) {
      console.warn('[subscribe] Missing KLAVIYO env vars. Received:', { email, phone, utm, referrer, path });
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Build consent array the way Klaviyo expects it
    const consent = [];
    if (consentEmail) consent.push('email');
    if (consentSMS) consent.push('sms');

    const profile = {
      email: email || undefined,
      phone_number: phone || undefined,
      $consent: consent.length ? consent : undefined,
      // Useful custom properties you’ll reuse in segments/flows
      source: 'maintenance_waitlist',
      path_joined: path,
      tz_offset_minutes: tzOffset,
      referrer,
      user_agent: userAgent,
      utm_source: utm.source || '',
      utm_medium: utm.medium || '',
      utm_campaign: utm.campaign || '',
      utm_content: utm.content || '',
      utm_term: utm.term || '',
    };

    // v2 List Subscribe (simple + reliable)
    const res = await fetch(`${KLAVIYO_API}/list/${listId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        profiles: [profile],
      }),
      // Keep it simple for now; Klaviyo handles dupes gracefully
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[subscribe] Klaviyo error:', res.status, text);
      return NextResponse.json({ ok: false, error: 'Klaviyo error' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[subscribe] Failed:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
