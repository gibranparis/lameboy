'use client'

import { useEffect, useRef, useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { getSwellClient } from '@/lib/swell'

const STEPS = ['contact', 'address', 'shipping', 'payment', 'confirmation']

const INPUT = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1.5px solid #e0e0e0',
  fontSize: 15,
  fontFamily: 'inherit',
  fontWeight: 600,
  outline: 'none',
  background: '#fff',
  color: '#111',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const BTN = {
  width: '100%',
  background: '#000',
  color: '#fff',
  border: 'none',
  padding: '14px 0',
  borderRadius: 28,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  fontFamily: 'inherit',
  transition: 'opacity 0.15s',
}

const COUNTRIES = [
  ['US','United States'],['CA','Canada'],['GB','United Kingdom'],['AU','Australia'],
  ['FR','France'],['DE','Germany'],['JP','Japan'],['MX','Mexico'],['BR','Brazil'],
  ['ES','Spain'],['IT','Italy'],['NL','Netherlands'],['SE','Sweden'],['NO','Norway'],
  ['DK','Denmark'],['FI','Finland'],['CH','Switzerland'],['AT','Austria'],['BE','Belgium'],
  ['PT','Portugal'],['PL','Poland'],['NZ','New Zealand'],['SG','Singapore'],['KR','South Korea'],
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888' }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 12, color: '#e00', marginTop: 2 }}>{error}</span>}
    </div>
  )
}

function Input({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{ ...INPUT, borderColor: focused ? '#000' : '#e0e0e0', ...style }}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
    />
  )
}

function Select({ style, children, ...props }) {
  return (
    <select
      {...props}
      style={{ ...INPUT, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%23666\' stroke-width=\'1.5\' fill=\'none\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', ...style }}
    >
      {children}
    </select>
  )
}

export default function CheckoutFlow() {
  const { items, total, count, reset, cartReady } = useCart()
  const [step, setStep] = useState('contact')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)

  // Form state
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState('US')
  const [shippingRates, setShippingRates] = useState([])
  const [selectedRate, setSelectedRate] = useState(null)
  const [cardName, setCardName] = useState('')
  const cardMounted = useRef(false)

  const swell = getSwellClient()

  // Redirect if cart is empty and no order — wait for cart to load first
  useEffect(() => {
    if (cartReady && !order && count === 0) {
      window.location.href = '/'
    }
  }, [cartReady, count, order])

  // Mount Stripe card element when reaching payment step
  useEffect(() => {
    if (step !== 'payment' || cardMounted.current) return
    cardMounted.current = true

    swell.payment.createElements({
      card: {
        elementId: 'lb-card-element',
        options: {
          style: {
            base: {
              fontSize: '15px',
              fontFamily: '-apple-system, sans-serif',
              fontWeight: '600',
              color: '#111',
              '::placeholder': { color: '#bbb' },
            },
            invalid: { color: '#e00' },
          },
        },
      },
    }).catch((e) => setError('Could not load card input. Please refresh and try again.'))
  }, [step])

  async function handleContact(e) {
    e.preventDefault()
    if (!email) return setError('Email is required')
    setError(null)
    setStep('address')
  }

  async function handleAddress(e) {
    e.preventDefault()
    if (!firstName || !lastName || !address1 || !city || !zip || !country) {
      return setError('Please fill in all required fields')
    }
    setError(null)
    setLoading(true)
    try {
      await swell.cart.update({
        account: { email },
        shipping: {
          name: `${firstName} ${lastName}`,
          address1,
          address2,
          city,
          state,
          zip,
          country,
        },
      })
      const rates = await swell.cart.getShippingRates()
      setShippingRates(rates?.services ?? [])
      if (rates?.services?.length) setSelectedRate(rates.services[0].id)
      setStep('shipping')
    } catch (err) {
      setError(err.message || 'Could not validate address. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleShipping(e) {
    e.preventDefault()
    if (!selectedRate) return setError('Please select a shipping method')
    setError(null)
    setLoading(true)
    try {
      await swell.cart.update({ shipping: { service: selectedRate } })
      setStep('payment')
    } catch (err) {
      setError(err.message || 'Could not set shipping. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePayment(e) {
    e.preventDefault()
    if (!cardName) return setError('Please enter the name on your card')
    setError(null)
    setLoading(true)
    try {
      await swell.payment.tokenize({ card: { name: cardName } })
      const result = await swell.cart.submitOrder()
      if (result?.errors) {
        const msg = Object.values(result.errors)[0]?.message || 'Payment failed'
        throw new Error(msg)
      }
      reset()
      setOrder(result)
      setStep('confirmation')
    } catch (err) {
      setError(err.message || 'Payment failed. Please check your card details and try again.')
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <div style={{ minHeight: '100dvh', background: '#f7f7f5', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <img src="/Blue hand-drawn symbol with _LAME_.png" alt="LAME" style={{ height: 32, display: 'block' }} />
        </a>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#888' }}>
          Checkout
        </span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,380px)', gap: 32, alignItems: 'start' }}>

        {/* Left — form */}
        <div>
          {/* Progress */}
          {step !== 'confirmation' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
              {['Contact', 'Address', 'Shipping', 'Payment'].map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: i <= stepIndex - 1 ? '#0bf05f' : i === stepIndex ? '#000' : '#ccc',
                  }}>
                    {label}
                  </span>
                  {i < 3 && <span style={{ color: '#ccc', fontSize: 12 }}>›</span>}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#c00', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Step: Contact */}
          {step === 'contact' && (
            <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Contact</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="First name">
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" required />
                </Field>
                <Field label="Last name">
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" required />
                </Field>
              </div>
              <Field label="Email">
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" required />
              </Field>
              <button type="submit" style={BTN}>Continue to Address</button>
            </form>
          )}

          {/* Step: Address */}
          {step === 'address' && (
            <form onSubmit={handleAddress} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" onClick={() => setStep('contact')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 0, color: '#888' }}>←</button>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Shipping Address</h2>
              </div>
              <Field label="Country">
                <Select value={country} onChange={e => { setCountry(e.target.value); setState('') }}>
                  {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </Select>
              </Field>
              <Field label="Street Address">
                <Input value={address1} onChange={e => setAddress1(e.target.value)} placeholder="123 Main St" required />
              </Field>
              <Field label="Apt, suite, etc. (optional)">
                <Input value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Apt 4B" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="City">
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Los Angeles" required />
                </Field>
                {country === 'US' ? (
                  <Field label="State">
                    <Select value={state} onChange={e => setState(e.target.value)} required>
                      <option value="">—</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Field>
                ) : (
                  <Field label="State / Province">
                    <Input value={state} onChange={e => setState(e.target.value)} placeholder="CA" />
                  </Field>
                )}
                <Field label="ZIP / Postal">
                  <Input value={zip} onChange={e => setZip(e.target.value)} placeholder="90001" required />
                </Field>
              </div>
              <button type="submit" style={{ ...BTN, opacity: loading ? 0.6 : 1 }} disabled={loading}>
                {loading ? 'Checking...' : 'Continue to Shipping'}
              </button>
            </form>
          )}

          {/* Step: Shipping Method */}
          {step === 'shipping' && (
            <form onSubmit={handleShipping} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" onClick={() => setStep('address')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 0, color: '#888' }}>←</button>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Shipping Method</h2>
              </div>
              {shippingRates.length === 0 ? (
                <p style={{ color: '#888', fontSize: 14 }}>No shipping rates available for this address.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {shippingRates.map(rate => (
                    <label key={rate.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: 12, border: `2px solid ${selectedRate === rate.id ? '#000' : '#e0e0e0'}`,
                      cursor: 'pointer', background: '#fff', transition: 'border-color 0.15s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input type="radio" name="rate" value={rate.id} checked={selectedRate === rate.id} onChange={() => setSelectedRate(rate.id)} style={{ accentColor: '#000' }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{rate.name}</div>
                          {rate.description && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{rate.description}</div>}
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>
                        {rate.price === 0 ? 'FREE' : `$${rate.price.toFixed(2)}`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <button type="submit" style={{ ...BTN, opacity: loading ? 0.6 : 1 }} disabled={loading || shippingRates.length === 0}>
                {loading ? 'Saving...' : 'Continue to Payment'}
              </button>
            </form>
          )}

          {/* Step: Payment */}
          {step === 'payment' && (
            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" onClick={() => setStep('shipping')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 0, color: '#888' }}>←</button>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Payment</h2>
              </div>
              <Field label="Name on card">
                <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Jane Doe" required />
              </Field>
              <Field label="Card details">
                <div
                  id="lb-card-element"
                  style={{ ...INPUT, padding: '14px', minHeight: 46 }}
                />
              </Field>
              <p style={{ margin: 0, fontSize: 12, color: '#888', textAlign: 'center' }}>
                🔒 Payments are processed securely by Stripe
              </p>
              <button type="submit" style={{ ...BTN, background: 'var(--hover-green, #0bf05f)', color: '#000', opacity: loading ? 0.6 : 1 }} disabled={loading}>
                {loading ? 'Processing...' : `Pay $${((total) / 100).toFixed(2)}`}
              </button>
            </form>
          )}

          {/* Step: Confirmation */}
          {step === 'confirmation' && order && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 700 }}>Order placed!</h2>
              <p style={{ margin: '0 0 6px', color: '#555', fontSize: 15 }}>
                Order #{order.number}
              </p>
              <p style={{ margin: '0 0 32px', color: '#888', fontSize: 14 }}>
                A confirmation has been sent to {order.account?.email ?? email}
              </p>
              <a href="/" style={{ ...BTN, display: 'inline-block', textDecoration: 'none', padding: '14px 40px', width: 'auto', borderRadius: 28 }}>
                Back to shop
              </a>
            </div>
          )}
        </div>

        {/* Right — order summary */}
        {step !== 'confirmation' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee', position: 'sticky', top: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#888' }}>
              Order Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{item.name}</span>
                    <span style={{ color: '#888', marginLeft: 6 }}>
                      {item.size && `${item.size} · `}×{item.qty}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700 }}>${((item.price * item.qty) / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #eee', paddingTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
              <span>Total</span>
              <span>${(total / 100).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: stack summary above form */}
      <style>{`
        @media (max-width: 680px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
