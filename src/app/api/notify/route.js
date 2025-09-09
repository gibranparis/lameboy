// src/app/api/notify/route.js
export const dynamic = 'force-dynamic';

function bad(body, code = 400) {
  return new Response(JSON.stringify({ error: body }), {
    status: code,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request) {
  try {
    const { email, phone } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return bad('Invalid email');
    }
    if (phone && !/^[+()\-.\s\d]{7,20}$/.test(phone)) {
      return bad('Invalid phone');
    }

    const API_KEY = process.env.MAILCHIMP_API_KEY;
    const SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX; // e.g. "us21"
    const LIST_ID = process.env.MAILCHIMP_LIST_ID;

    if (!API_KEY || !SERVER_PREFIX || !LIST_ID) {
      return bad(
        'Not configured: set MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_LIST_ID in env.',
        500
      );
    }

    const url = `https://${SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`;

    // Mailchimp requires Basic auth where username can be anything; API key goes as the password
    const auth = 'Basic ' + Buffer.from(`anystring:${API_KEY}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',             // or 'pending' for double opt-in
        merge_fields: { PHONE: phone || '' }, // create/enable PHONE merge field in your audience
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      return bad(err?.detail || 'Mailchimp error', res.status);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return bad('Unexpected server error', 500);
  }
}
