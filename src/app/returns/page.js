import { CONTACT_EMAIL, BRAND, SHIP_DAYS_MIN, SHIP_DAYS_MAX, FINAL_SALE_LINE } from '@/lib/store-info'

export const metadata = {
  title: `${FINAL_SALE_LINE} — ${BRAND}`,
  description: `Every ${BRAND} piece is made to order, so all sales are final. Defective, damaged, or wrong items are replaced or refunded — email ${CONTACT_EMAIL}.`,
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

const H2 = { fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }
const P = { fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }
const Mail = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'inherit', fontWeight: 700 }}>{CONTACT_EMAIL}</a>
)

// URL stays /returns because order emails link here.
export default function SalesPolicyPage() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.01em' }}>
        <RainbowText>{FINAL_SALE_LINE}</RainbowText>
      </h1>

      <section style={{ marginBottom: 32 }}>
        <h2 style={H2}>Made to Order</h2>
        <p style={P}>
          Every piece is made to order, so all sales are final. No returns, exchanges, or
          refunds for size, fit, or change of mind. Check the size before you order.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={H2}>Defective, Damaged, or Wrong Item</h2>
        <p style={P}>
          Email <Mail /> within <strong>14 days</strong> of delivery with a photo and your
          order number and we'll replace it or refund it, our choice, at no cost to you.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={H2}>Late Orders</h2>
        <p style={P}>
          If we can't ship within {SHIP_DAYS_MIN}–{SHIP_DAYS_MAX} business days, we'll email
          you and you can cancel for a full refund.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={H2}>Lost in Transit</h2>
        <p style={P}>
          Email <Mail /> with your order number and we'll sort it out with the carrier.
        </p>
      </section>

      <p style={{ fontSize: 13, color: '#aaa', marginTop: 40 }}>
        <a href="/" style={{ color: 'inherit', textDecoration: 'underline' }}>← Back to shop</a>
      </p>
    </div>
  )
}
