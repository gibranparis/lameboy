// src/lib/order-emails.js
// Transactional email via Resend. Only called from the Stripe webhook after a
// new order is confirmed — never from client code. Both functions swallow
// missing-env-var conditions via console.warn so the webhook never fails on
// an email problem. Callers are responsible for wrapping in try/catch.
import { Resend } from 'resend'
import { BRAND, CONTACT_EMAIL, SHIP_DAYS_MIN, SHIP_DAYS_MAX } from '@/lib/store-info'

const CHAKRA = ['#FF0000', '#FF8C00', '#FFD700', '#00C853', '#00BFFF', '#6A0DAD', '#EE82EE']

function rainbowSpans(text) {
  return text
    .split('')
    .map((ch, i) => `<span style="color:${CHAKRA[i % 7]}">${ch}</span>`)
    .join('')
}

const money = (cents) => `$${(cents / 100).toFixed(2)}`

function shortId(id) {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

function buildConfirmationHtml({ order, items, sid }) {
  const addr = order.shipping_address
  const addrLines = [
    addr.address1,
    addr.address2 || null,
    addr.city,
    [addr.state, addr.zip].filter(Boolean).join(' '),
    addr.country !== 'US' ? addr.country : null,
  ]
    .filter(Boolean)
    .join('<br>')

  const firstName = (order.name || 'friend').split(' ')[0]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lameboy.com'

  const itemRows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 0;font-size:14px;border-bottom:1px solid #eee;">
        ${i.name}${i.size ? ` <span style="color:#888;font-size:12px">(${i.size})</span>` : ''} &times; ${i.qty}
      </td>
      <td style="padding:8px 0;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #eee;">
        ${money(i.priceCents * i.qty)}
      </td>
    </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:32px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px">

        <!-- Wordmark -->
        <tr><td align="center" style="padding-bottom:28px">
          <a href="${siteUrl}" style="text-decoration:none;font-size:40px;font-weight:900;letter-spacing:0.1em;line-height:1">
            ${rainbowSpans(BRAND)}
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#fff;border-radius:16px;border:1px solid #eee;padding:28px 24px">

          <p style="margin:0 0 4px;font-size:19px;font-weight:700">Thanks, ${firstName}!</p>
          <p style="margin:0 0 24px;font-size:13px;color:#999">Order #${sid}</p>

          <!-- Items + totals -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px">
            ${itemRows}
            <tr>
              <td style="padding:12px 0 4px;font-size:13px;color:#888">Subtotal</td>
              <td style="padding:12px 0 4px;font-size:13px;font-weight:700;text-align:right">${money(order.subtotal_cents)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#888">Shipping</td>
              <td style="padding:4px 0;font-size:13px;font-weight:700;text-align:right">${order.shipping_cost_cents === 0 ? 'FREE' : money(order.shipping_cost_cents)}</td>
            </tr>
            <tr>
              <td style="padding:12px 0 0;font-size:16px;font-weight:700;border-top:1px solid #eee">Total</td>
              <td style="padding:12px 0 0;font-size:16px;font-weight:700;text-align:right;border-top:1px solid #eee">${money(order.total_cents)}</td>
            </tr>
          </table>

          <!-- Ship-to -->
          <div style="background:#f7f7f5;border-radius:10px;padding:14px 16px;margin-bottom:20px">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#999">Ship to</p>
            <p style="margin:0;font-size:14px;line-height:1.55">${order.name}<br>${addrLines}</p>
          </div>

          <!-- Made-to-order notice -->
          <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.65">
            This is a made-to-order item. It ships in <strong>${SHIP_DAYS_MIN}&ndash;${SHIP_DAYS_MAX} business days</strong> — we&rsquo;ll send tracking once it&rsquo;s on its way.
          </p>
          <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.65">
            All sales final. If something arrives defective or wrong, reply to this email.
          </p>

          <!-- Footer links -->
          <p style="margin:0;font-size:12px;color:#bbb;line-height:1.8">
            <a href="${siteUrl}/shipping" style="color:#bbb;text-decoration:underline">Shipping policy</a>
            &nbsp;&middot;&nbsp;
            <a href="${siteUrl}/returns" style="color:#bbb;text-decoration:underline">Sales policy</a>
            &nbsp;&middot;&nbsp;
            Questions? <a href="mailto:${CONTACT_EMAIL}" style="color:#bbb;text-decoration:underline">${CONTACT_EMAIL}</a>
          </p>

        </td></tr>

        <!-- Sign-off -->
        <tr><td align="center" style="padding:28px 0 0;font-size:12px;color:#bbb;font-style:italic">
          let all mankind evolve
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildConfirmationText({ order, items, sid }) {
  const addr = order.shipping_address
  const addrLines = [
    addr.address1,
    addr.address2 || null,
    addr.city,
    [addr.state, addr.zip].filter(Boolean).join(' '),
    addr.country !== 'US' ? addr.country : null,
  ]
    .filter(Boolean)
    .join('\n')

  const firstName = (order.name || 'friend').split(' ')[0]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lameboy.com'

  const itemLines = items
    .map((i) => `${i.name}${i.size ? ` (${i.size})` : ''} x${i.qty}  ${money(i.priceCents * i.qty)}`)
    .join('\n')

  return `Thanks, ${firstName}! Order #${sid}

${itemLines}

Subtotal:  ${money(order.subtotal_cents)}
Shipping:  ${order.shipping_cost_cents === 0 ? 'FREE' : money(order.shipping_cost_cents)}
Total:     ${money(order.total_cents)}

Ship to:
${order.name}
${addrLines}

Made to order — ships in ${SHIP_DAYS_MIN}–${SHIP_DAYS_MAX} business days. We'll send tracking.

All sales final. If something arrives defective or wrong, reply to this email.

Shipping policy: ${siteUrl}/shipping
Sales policy: ${siteUrl}/returns
Questions: ${CONTACT_EMAIL}

let all mankind evolve`
}

function buildAlertHtml({ order, items, sid }) {
  const addr = order.shipping_address
  const addrLines = [
    addr.address1,
    addr.address2 || null,
    addr.city,
    [addr.state, addr.zip].filter(Boolean).join(' '),
    addr.country,
  ]
    .filter(Boolean)
    .join('<br>')

  const carrier = [order.shipping_carrier, order.shipping_service].filter(Boolean).join(' ')

  const itemRows = items
    .map(
      (i) => `<tr>
      <td style="padding:4px 0;font-size:13px">${i.name}${i.size ? ` (${i.size})` : ''} &times; ${i.qty}</td>
      <td style="padding:4px 0;font-size:13px;text-align:right">${money(i.priceCents * i.qty)}</td>
    </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:monospace;font-size:13px;padding:24px;color:#111;background:#fff">
  <h2 style="margin:0 0 4px;font-size:16px">Order #${sid}</h2>
  <p style="margin:0 0 16px;color:#555">${order.email}</p>
  <p style="margin:0 0 12px"><strong>${order.name}</strong></p>

  <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;width:100%;max-width:400px">
    ${itemRows}
    <tr><td colspan="2" style="padding:8px 0 0;border-top:1px solid #eee"></td></tr>
    <tr>
      <td style="padding:2px 0;font-size:13px;color:#888">Subtotal</td>
      <td style="padding:2px 0;font-size:13px;text-align:right">${money(order.subtotal_cents)}</td>
    </tr>
    <tr>
      <td style="padding:2px 0;font-size:13px;color:#888">Shipping${carrier ? ` (${carrier})` : ''}</td>
      <td style="padding:2px 0;font-size:13px;text-align:right">${order.shipping_cost_cents === 0 ? 'FREE' : money(order.shipping_cost_cents)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0 0;font-size:14px;font-weight:700">Total</td>
      <td style="padding:8px 0 0;font-size:14px;font-weight:700;text-align:right">${money(order.total_cents)}</td>
    </tr>
  </table>

  <p style="margin:0;font-size:13px;line-height:1.6;color:#555">
    ${order.name}<br>${addrLines}
  </p>
</body>
</html>`
}

/**
 * Send the customer receipt email. Silently skips if RESEND_API_KEY is missing.
 * @param {{ id: string, email: string, name: string, shipping_address: object, shipping_cost_cents: number, subtotal_cents: number, total_cents: number }} order
 * @param {Array<{ name: string, size?: string, priceCents: number, qty: number }>} items
 */
export async function sendOrderConfirmation(order, items) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[order-emails] RESEND_API_KEY not set — skipping customer confirmation')
    return
  }
  const sid = shortId(order.id)
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: `${BRAND} <${CONTACT_EMAIL}>`,
    replyTo: 'lameboy38baby@gmail.com',
    to: order.email,
    subject: `Your ${BRAND} order`,
    html: buildConfirmationHtml({ order, items, sid }),
    text: buildConfirmationText({ order, items, sid }),
  })
}

/**
 * Send the owner alert email. Silently skips if RESEND_API_KEY or NOTIFY_EMAIL is missing.
 * @param {{ id: string, email: string, name: string, shipping_address: object, shipping_carrier?: string, shipping_service?: string, shipping_cost_cents: number, subtotal_cents: number, total_cents: number }} order
 * @param {Array<{ name: string, size?: string, priceCents: number, qty: number }>} items
 */
export async function sendOrderAlert(order, items) {
  const apiKey = process.env.RESEND_API_KEY
  const notifyEmail = process.env.NOTIFY_EMAIL
  if (!apiKey || !notifyEmail) {
    console.warn('[order-emails] RESEND_API_KEY or NOTIFY_EMAIL not set — skipping owner alert')
    return
  }
  const sid = shortId(order.id)
  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: `${BRAND} <${CONTACT_EMAIL}>`,
    replyTo: 'lameboy38baby@gmail.com',
    to: notifyEmail,
    subject: `New order ${sid} — ${money(order.total_cents)}`,
    html: buildAlertHtml({ order, items, sid }),
  })
}
