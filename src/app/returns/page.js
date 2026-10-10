import { RETURN_DAYS, CONTACT_EMAIL, BRAND } from '@/lib/store-info'

export const metadata = {
  title: `Returns & Exchanges — ${BRAND}`,
  description: `${BRAND} accepts returns within ${RETURN_DAYS} days for unworn, unwashed items. Email ${CONTACT_EMAIL} to start a return.`,
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

export default function ReturnsPage() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.01em' }}>
        <RainbowText>Returns</RainbowText>
      </h1>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Eligibility</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          We accept returns within <strong>{RETURN_DAYS} days</strong> of delivery for items
          that are unworn and unwashed with all tags attached. Because each piece is
          made to order, we are unable to accept returns on items that have been worn
          or washed.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>How to Return</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: '0 0 10px' }}>
          Email <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'inherit', fontWeight: 700 }}>{CONTACT_EMAIL}</a> with
          your order number and reason for return. We'll reply within 2 business days.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          Customers cover return shipping unless the item arrived defective or we
          sent the wrong item — in those cases we'll send a prepaid label.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Refunds</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          Once we receive and inspect the return, refunds are issued to the original
          payment method within 5–7 business days. Shipping costs are non-refundable
          unless the return is due to our error.
        </p>
      </section>

      <p style={{ fontSize: 13, color: '#aaa', marginTop: 40 }}>
        <a href="/" style={{ color: 'inherit', textDecoration: 'underline' }}>← Back to shop</a>
      </p>
    </div>
  )
}
