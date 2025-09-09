export async function POST(req) {
  try {
    const { email, phone } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 });
    }
    // Phone is optional; basic sanity check if provided
    if (phone && !/^\+?[0-9\-().\s]{7,}$/.test(phone)) {
      return new Response(JSON.stringify({ error: "Invalid phone" }), { status: 400 });
    }

    // TODO: send to Klaviyo/List, DB, or email — placeholder here
    // Example (later):
    // await fetch("https://a.klaviyo.com/api/profile-import", { ... })

    // For now just acknowledge
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Bad payload" }), { status: 400 });
  }
}
