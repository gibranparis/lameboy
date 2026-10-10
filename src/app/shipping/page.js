import { SHIP_DAYS_MIN, SHIP_DAYS_MAX, CONTACT_EMAIL, BRAND, SHIP_FROM } from '@/lib/store-info'

export const metadata = {
  title: `Shipping Policy — ${BRAND}`,
  description: `${BRAND} is made to order and ships in ${SHIP_DAYS_MIN}–${SHIP_DAYS_MAX} business days from ${SHIP_FROM}. Free domestic shipping on orders over $80.`,
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

export default function ShippingPage() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.01em' }}>
        <RainbowText>Shipping</RainbowText>
      </h1>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Made to Order</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          Every {BRAND} piece is made to order on Hanes Beefy blanks. Orders ship in{' '}
          <strong>{SHIP_DAYS_MIN}–{SHIP_DAYS_MAX} business days</strong> from {SHIP_FROM}.
          We'll email your tracking number as soon as it's on its way.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Domestic (United States)</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          Standard shipping on all US orders. <strong>Free shipping on orders over $80.</strong>
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>International</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          We ship worldwide. International rates are calculated at checkout.
          Customers are responsible for any import duties, taxes, or customs fees
          charged by their country. These vary by destination and are not included
          in the order total.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Late or Missing Orders</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          If your order hasn't shipped within {SHIP_DAYS_MAX} business days, email us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'inherit', fontWeight: 700 }}>{CONTACT_EMAIL}</a>{' '}
          and we'll make it right — including a full cancellation and refund if you prefer.
        </p>
      </section>

      <p style={{ fontSize: 13, color: '#aaa', marginTop: 40 }}>
        <a href="/" style={{ color: 'inherit', textDecoration: 'underline' }}>← Back to shop</a>
      </p>
    </div>
  )
}
