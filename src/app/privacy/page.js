import { CONTACT_EMAIL, BRAND } from '@/lib/store-info'

export const metadata = {
  title: `Privacy Policy — ${BRAND}`,
  description: `How ${BRAND} collects, uses, and protects your personal information.`,
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

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px', fontFamily: 'inherit' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' }}>
        <RainbowText>Privacy</RainbowText>
      </h1>
      <p style={{ fontSize: 13, color: '#aaa', marginBottom: 32 }}>Effective October 2026</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>What We Collect</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          When you place an order or join our list we collect your name, email address,
          phone number, shipping address, and order details. We do not store full card
          numbers — payments are handled by Stripe.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>How We Use It</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          We use your information to fulfill orders, send shipping updates, and
          occasionally reach out about new drops if you've joined the list. We do not
          sell your data.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Service Providers</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          We work with the following processors to operate the store: Stripe (payments),
          Shippo (shipping labels), Supabase (database), Resend (email), and Vercel
          (hosting). Each has their own privacy policy.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Device-Local Storage</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          If you fill out the newsletter form, your name, email, and phone are saved
          locally on your device (localStorage) so checkout can prefill them for you.
          This data never leaves your device except when you place an order. Tapping
          the heart icon on the shop clears it.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 8 }}>Your Rights</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#222', margin: 0 }}>
          You can request deletion of your personal data at any time by emailing{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'inherit', fontWeight: 700 }}>{CONTACT_EMAIL}</a>.
          We'll remove your information from our systems within 30 days.
        </p>
      </section>

      <p style={{ fontSize: 13, color: '#aaa', marginTop: 40 }}>
        <a href="/" style={{ color: 'inherit', textDecoration: 'underline' }}>← Back to shop</a>
      </p>
    </div>
  )
}
