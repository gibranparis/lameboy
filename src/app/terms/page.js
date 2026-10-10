import { CONTACT_EMAIL, BRAND, SHIP_DAYS_MIN, SHIP_DAYS_MAX } from '@/lib/store-info'

export const metadata = {
  title: `Terms of Service — ${BRAND}`,
  description: `Terms and conditions for shopping at ${BRAND}.`,
}

const CHAKRA = ['#FF0000','#FF8C00','#FFD700','#00C853','#00BFFF','#6A0DAD','#EE82EE']

function RainbowText({ children }) {
  return (
    <span>
      {String(children).split('').map((ch, i) => (
        <span key={i} style={{ color: CHAKRA[i % 7] }}>{ch}</span>
      ))}
    </span>
  )
}

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.01em' }}>
        <RainbowText>Terms</RainbowText>
      </h1>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Orders & Pricing</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          All prices are in USD. By placing an order you confirm the information
          provided is accurate and you are authorized to use the payment method.
          We reserve the right to cancel orders that appear fraudulent.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Made to Order</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          Every {BRAND} item is made to order. Production takes{' '}
          {SHIP_DAYS_MIN}–{SHIP_DAYS_MAX} business days before shipping.
          See our <a href="/shipping" style={{ color: 'inherit', fontWeight: 700 }}>Shipping Policy</a> for
          full details, including our late-order cancellation guarantee.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>All Sales Final</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          Because every item is made to order, all sales are final: no returns, exchanges,
          or refunds for size, fit, or change of mind. If an item arrives defective, damaged,
          or wrong, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'inherit', fontWeight: 700 }}>{CONTACT_EMAIL}</a>{' '}
          within 14 days of delivery and we'll replace or refund it at no cost to you. If we
          can't ship within {SHIP_DAYS_MIN}–{SHIP_DAYS_MAX} business days, you may cancel for a
          full refund. See our <a href="/returns" style={{ color: 'inherit', fontWeight: 700 }}>Sales Policy</a> for
          details.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Governing Law</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          These terms are governed by the laws of the State of Florida.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Contact</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          Questions? Email <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'inherit', fontWeight: 700 }}>{CONTACT_EMAIL}</a>.
        </p>
      </section>

      <p style={{ fontSize: 13, color: '#aaa', marginTop: 40 }}>
        <a href="/" style={{ color: 'inherit', textDecoration: 'underline' }}>← Back to shop</a>
      </p>
    </div>
  )
}
