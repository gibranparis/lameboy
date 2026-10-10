'use client'

import { useEffect, useRef, useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import EmailChips from '@/components/EmailChips'
import { getStripePromise } from '@/lib/stripe-client'
import { Elements, ExpressCheckoutElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { COUNTRIES, US_STATES } from '@/lib/countries'
import { clearProfile, getProfile, saveProfile } from '@/lib/profile'
import { SHIP_DAYS_MIN, SHIP_DAYS_MAX } from '@/lib/store-info'

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
  background: 'var(--hover-green, #0bf05f)',
  color: '#000',
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

const CHAKRA = ['#FF0000','#FF8C00','#FFD700','#00C853','#00BFFF','#6A0DAD','#EE82EE']

// Maps product name keywords → their actual color
const HOODIE_COLORS = {
  gray:  '#999999',
  grey:  '#999999',
  brown: '#8B5E3C',
  black: '#111111',
  green: '#00C853',
  blue:  '#00BFFF',
  white: '#cccccc',
  red:   '#FF0000',
  pink:  '#FF69B4',
  purple:'#6A0DAD',
}

function hoodieColor(name = '') {
  const lower = name.toLowerCase()
  for (const [key, color] of Object.entries(HOODIE_COLORS)) {
    if (lower.includes(key)) return color
  }
  return null
}

function Field({ label, htmlFor, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label htmlFor={htmlFor} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888' }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 12, color: '#e00', marginTop: 2 }}>{error}</span>}
    </div>
  )
}

function Input({ style, value, onChange, ...props }) {
  const [focused, setFocused] = useState(false)
  const str = String(value ?? '')
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Chakra-colored display overlay */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        padding: '12px 14px', fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
        pointerEvents: 'none', overflow: 'hidden', zIndex: 1, whiteSpace: 'pre',
      }}>
        {str ? str.split('').map((ch, i) => (
          <span key={i} style={{ color: CHAKRA[i % 7] }}>{ch}</span>
        )) : (
          <span style={{ color: '#bbb', fontWeight: 400 }}>{props.placeholder}</span>
        )}
      </div>
      {/* The real placeholder stays on the <input> (hidden via .lb-field::placeholder)
          so Safari's autofill heuristics can still read it. */}
      <input
        {...props}
        className="lb-field"
        value={value}
        onChange={onChange}
        style={{ ...INPUT, color: 'transparent', caretColor: '#555', borderColor: focused ? '#000' : '#e0e0e0', ...style }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
      />
    </div>
  )
}

function Select({ style, children, ...props }) {
  return (
    <select
      {...props}
      className="lb-field"
      style={{ ...INPUT, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%23666\' stroke-width=\'1.5\' fill=\'none\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', ...style }}
    >
      {children}
    </select>
  )
}

const STRIPE_APPEARANCE = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0bf05f',
    colorText: '#111',
    fontFamily: 'inherit',
    borderRadius: '10px',
    fontSizeBase: '15px',
  },
  rules: {
    '.Input': { border: '1.5px solid #e0e0e0', padding: '12px 14px', fontWeight: '600' },
    '.Input:focus': { border: '1.5px solid #000', boxShadow: 'none' },
    '.Label': { fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888' },
  },
}

// Real-time field validation for the checkout form. Loose on purpose —
// only US and CA get a real postal-code pattern; every other country just
// needs a non-empty ZIP, since international postal formats vary too much
// to be worth encoding here.
function validateField(name, value, country) {
  const v = String(value ?? '').trim()
  switch (name) {
    case 'name':
    case 'address1':
    case 'city':
      return v ? null : 'Required'
    case 'email':
      if (!v) return 'Required'
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email'
    case 'state':
      return country === 'US' && !v ? 'Required' : null
    case 'zip':
      if (!v) return 'Required'
      if (country === 'US') return /^\d{5}(-\d{4})?$/.test(v) ? null : 'Enter a valid ZIP code'
      if (country === 'CA') return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v) ? null : 'Enter a valid postal code'
      return null
    case 'phone':
      return country !== 'US' && !v ? 'Required for international shipping' : null
    default:
      return null
  }
}

const FORM_FIELDS = ['email', 'name', 'address1', 'city', 'state', 'zip', 'phone']

// Input `name` attribute → form state key. Country comes first so a DOM
// sync always applies it before state (a country change clears state).
const FIELD_NAMES = {
  'country': 'country',
  'name': 'name',
  'email': 'email',
  'address-line1': 'address1',
  'address-line2': 'address2',
  'address-level2': 'city',
  'address-level1': 'state',
  'postal-code': 'zip',
  'tel': 'phone',
}

// Starting country/state from Vercel's IP geolocation headers. Only used as
// initial state, so it never overrides anything typed or restored later.
// Falls back to US with no state when the headers are missing or unknown.
function geoDefaults(geoCountry, geoRegion) {
  const c = String(geoCountry ?? '').trim().toUpperCase()
  const country = COUNTRIES.some(([code]) => code === c) ? c : 'US'
  const r = String(geoRegion ?? '').trim().toUpperCase()
  const state = country === 'US' && c === 'US' && US_STATES.includes(r) ? r : ''
  return { country, state }
}

const COUNTRY_CODES = COUNTRIES.map(([code]) => code)
// Shippo needs a phone on international shipments; rate quotes don't need
// the real one, so this stands in until the customer types theirs.
const PLACEHOLDER_PHONE = '0000000000'

const money = (cents) => `$${(cents / 100).toFixed(2)}`
const rateLabel = (rate) => (rate.name && rate.name !== rate.provider ? `${rate.provider} ${rate.name}` : rate.name || rate.provider)

async function fetchRates(destination, items, signal) {
  const res = await fetch('/api/shipping/rates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination, items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })) }),
    signal,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not fetch shipping rates')
  return data.rates ?? []
}

async function createPaymentIntent(payload) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.clientSecret) throw new Error(data.error || 'Could not start checkout')
  return data.clientSecret
}

function returnUrl() {
  return `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/checkout`
}

/** Order summary lines, shared by the desktop sidebar and the mobile bar. */
function SummaryLines({ items, subtotal, rate }) {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
            <div>
              <span style={{ fontWeight: 700, color: hoodieColor(item.name) ?? '#111' }}>{item.name}</span>
              <span style={{ color: '#888', marginLeft: 6 }}>
                {item.size && `${item.size} · `}×{item.qty}
              </span>
            </div>
            <span style={{ fontWeight: 700 }}>{money(item.price * item.qty)}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #eee', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>Subtotal</span>
          <span style={{ fontWeight: 700 }}>{money(subtotal)}</span>
        </div>
        {rate && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Shipping</span>
              <span style={{ fontWeight: 700 }}>{rate.price === 0 ? 'FREE' : money(rate.price)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
              <span>Total</span>
              <span>{money(subtotal + rate.price)}</span>
            </div>
          </>
        )}
      </div>
      <p style={{ margin: '14px 0 0', fontSize: 11, color: '#aaa', fontWeight: 600 }}>
        Made to order · ships in {SHIP_DAYS_MIN}–{SHIP_DAYS_MAX} business days
      </p>
    </>
  )
}

/**
 * Holds <Elements> in deferred-intent mode (no PaymentIntent until Pay).
 * The options are captured once, the first time the cart has a subtotal,
 * and Elements stays mounted after that — reset() empties the cart on
 * success, and the confirmation screen still renders inside it.
 */
export default function CheckoutFlow({ geoCountry = null, geoRegion = null }) {
  const { total, cartReady } = useCart()
  const [stripePromise] = useState(() => getStripePromise())
  const [options, setOptions] = useState(null)

  useEffect(() => {
    if (!options && cartReady && total > 0) {
      setOptions({ mode: 'payment', amount: total, currency: 'usd', paymentMethodTypes: ['card', 'link'], appearance: STRIPE_APPEARANCE })
    }
  }, [options, cartReady, total])

  if (!stripePromise) {
    return (
      <Shell>
        <p style={{ color: '#c00', fontSize: 14, textAlign: 'center', padding: '40px 16px' }}>
          Payments are unavailable right now. Please try again later.
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      {options ? (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutPage geoCountry={geoCountry} geoRegion={geoRegion} />
        </Elements>
      ) : (
        <CartGuard />
      )}
    </Shell>
  )
}

/** Before Elements mounts: bounce an empty cart back to the shop. */
function CartGuard() {
  const { count, cartReady } = useCart()
  useEffect(() => {
    if (cartReady && count === 0) window.location.href = '/'
  }, [cartReady, count])
  return <p style={{ textAlign: 'center', color: '#888', fontSize: 14, padding: '40px 0' }}>Loading…</p>
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#f7f7f5', fontFamily: 'inherit' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <img src="/Blue hand-drawn symbol with _LAME_.png" alt="LAME" style={{ height: 32, display: 'block' }} />
        </a>
      </div>
      {children}
      <style>{`
        /* Real placeholder kept on the input for autofill heuristics; the
           rainbow overlay draws the visible one. */
        .lb-field::placeholder { color: transparent; }
        /* No-op animation so onAnimationStart fires when a field is autofilled. */
        @keyframes onAutoFillStart { from {} to {} }
        .lb-field:-webkit-autofill { animation-name: onAutoFillStart; animation-duration: 1ms; }
        /* Chrome forces visible text and a blue fill on autofilled inputs;
           keep the input transparent so only the overlay shows. */
        input.lb-field:-webkit-autofill {
          -webkit-text-fill-color: transparent;
          box-shadow: 0 0 0 1000px #fff inset;
        }
        .co-layout { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,380px); gap: 32px; align-items: start; }
        .co-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .co-summary-bar { display: none; }
        @media (max-width: 680px) {
          .co-layout { grid-template-columns: 1fr; gap: 16px; }
          .co-summary-side { display: none; }
          .co-summary-bar { display: block; }
          .co-row3 { grid-template-columns: 1fr 1fr; }
          .co-row3 > :first-child { grid-column: 1 / -1; }
        }
      `}</style>
    </div>
  )
}

/** The whole single-page checkout. Rendered inside <Elements>. */
function CheckoutPage({ geoCountry, geoRegion }) {
  const stripe = useStripe()
  const elements = useElements()
  const { items, total: subtotal, count, reset, cartReady } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [paymentIntentId, setPaymentIntentId] = useState(null)
  const [summaryOpen, setSummaryOpen] = useState(false)

  // Form state
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState(() => geoDefaults(geoCountry, geoRegion).state)
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState(() => geoDefaults(geoCountry, geoRegion).country)
  const [phone, setPhone] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [emailFocused, setEmailFocused] = useState(false)
  const [returning, setReturning] = useState(false)
  // Saved complete address → contact + address render as one summary card.
  const [collapsed, setCollapsed] = useState(false)
  // Skip the rate debounce for the first quote of a saved address.
  const instantQuoteRef = useRef(false)

  // Shipping
  const [rates, setRates] = useState([])
  const [selectedRate, setSelectedRate] = useState(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesError, setRatesError] = useState(null)
  const rate = rates.find((r) => r.id === selectedRate) ?? null
  const shippingCents = rate?.price ?? 0

  // Express checkout
  const [expressAvailable, setExpressAvailable] = useState(null)
  // Card form accordion: collapsed by default when wallets are available
  const [cardOpen, setCardOpen] = useState(false)
  const cardFormRef = useRef(null)

  const fieldValues = { email, name, address1, city, state, zip, phone }
  const countryRef = useRef(country)
  const setters = {
    name: setName, email: setEmail,
    address1: setAddress1, address2: setAddress2, city: setCity,
    state: setState, zip: setZip, phone: setPhone,
  }

  function onFieldBlur(field) {
    const msg = validateField(field, fieldValues[field], country)
    setFieldErrors((prev) => ({ ...prev, [field]: msg }))
  }

  // Changing country clears state, unless clearState is false (DOM syncs,
  // where the state field's current value is already the one to keep).
  function applyCountry(value, clearState) {
    if (value === countryRef.current) return
    countryRef.current = value
    setCountry(value)
    if (clearState) setState('')
  }

  // Browsers (iOS Safari especially) can autofill without React's onChange
  // seeing it, which leaves the rainbow overlay empty. These handlers copy
  // the DOM value into state from the form-level input event and from the
  // :-webkit-autofill animation hook.
  function syncField(fieldName, value, clearState) {
    const key = FIELD_NAMES[fieldName]
    if (!key) return
    if (key === 'country') applyCountry(value, clearState)
    else setters[key](value)
  }

  function onFormInput(e) {
    syncField(e.target.name, e.target.value, true)
  }

  function onFormAnimationStart(e) {
    if (e.animationName === 'onAutoFillStart') syncField(e.target.name, e.target.value, false)
  }

  // Read every field straight from the form DOM so a missed autofill event
  // can never submit blanks. Returns the values for immediate use.
  function syncFromForm(form) {
    const values = { ...fieldValues, address2, country }
    for (const [fieldName, key] of Object.entries(FIELD_NAMES)) {
      const el = form.elements.namedItem(fieldName)
      if (!el) continue
      values[key] = el.value
      syncField(fieldName, el.value, false)
    }
    return values
  }

  // Prefill every field from the device profile (heart join form or a past
  // checkout). Runs once on mount, so it only replaces the geo defaults —
  // never anything typed.
  useEffect(() => {
    const p = getProfile()
    if (!p) return
    const savedCountry = String(p.country ?? '').toUpperCase()
    const nextCountry = COUNTRY_CODES.includes(savedCountry) ? savedCountry : countryRef.current
    if (nextCountry !== countryRef.current) applyCountry(nextCountry, false)
    let nextState = state
    if (p.state) {
      const st = nextCountry === 'US' ? p.state.trim().toUpperCase() : p.state
      if (nextCountry !== 'US' || US_STATES.includes(st)) nextState = st
      else if (savedCountry === 'US') nextState = ''
    }
    const v = {
      email: p.email ?? '', name: p.name ?? '', phone: p.phone ?? '',
      address1: p.address1 ?? '', address2: p.address2 ?? '',
      city: p.city ?? '', state: nextState, zip: p.zip ?? '',
    }
    setEmail(v.email); setName(v.name); setPhone(v.phone)
    setAddress1(v.address1); setAddress2(v.address2)
    setCity(v.city); setState(v.state); setZip(v.zip)
    setReturning(true)

    const complete = COUNTRY_CODES.includes(savedCountry) &&
      FORM_FIELDS.every((f) => !validateField(f, v[f], nextCountry))
    if (complete) {
      instantQuoteRef.current = true
      setCollapsed(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function clearSaved() {
    clearProfile()
    const geo = geoDefaults(geoCountry, geoRegion)
    countryRef.current = geo.country
    setCountry(geo.country)
    setState(geo.state)
    setEmail(''); setName(''); setPhone('')
    setAddress1(''); setAddress2(''); setCity(''); setZip('')
    setFieldErrors({})
    setReturning(false)
    setCollapsed(false)
  }

  // Redirect if cart is empty and no order. paymentIntentId is set
  // synchronously in handlePaymentSuccess before reset() empties the cart,
  // so a payment in flight (or done, awaiting the webhook) never gets
  // bounced to '/' by this guard.
  useEffect(() => {
    if (cartReady && !order && !paymentIntentId && count === 0) {
      window.location.href = '/'
    }
  }, [cartReady, count, order, paymentIntentId])

  // US ZIP → city/state, only filling fields that are still empty.
  useEffect(() => {
    if (country !== 'US' || !/^\d{5}$/.test(zip)) return
    const ctrl = new AbortController()
    fetch(`https://api.zippopotam.us/us/${zip}`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const place = data?.places?.[0]
        if (!place || countryRef.current !== 'US') return
        const placeCity = place['place name']
        const placeState = place['state abbreviation']
        if (placeCity) setCity((c) => c || placeCity)
        if (US_STATES.includes(placeState)) setState((s) => s || placeState)
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [zip, country])

  // Live shipping rates, debounced, once the address is complete enough.
  const addressReady = Boolean(address1.trim() && city.trim() && country && !validateField('zip', zip, country))
  const phoneRef = useRef(phone)
  phoneRef.current = phone
  useEffect(() => {
    setRates([])
    setSelectedRate(null)
    setRatesError(null)
    if (!addressReady || !items.length) {
      setRatesLoading(false)
      return
    }
    setRatesLoading(true)
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const destination = {
          name: name || undefined,
          address1, address2, city, state, zip, country,
          phone: country !== 'US' ? phoneRef.current || PLACEHOLDER_PHONE : undefined,
        }
        const next = await fetchRates(destination, items, ctrl.signal)
        if (!next.length) throw new Error('No shipping options for this address')
        // Rates come back sorted cheapest-first from /api/shipping/rates.
        setRates(next)
        setSelectedRate(next[0].id)
      } catch (err) {
        if (err.name === 'AbortError') return
        setRatesError(err.message === 'Could not fetch shipping rates' ? 'Couldn’t load shipping. Check your address.' : err.message)
      } finally {
        if (!ctrl.signal.aborted) setRatesLoading(false)
      }
    }, instantQuoteRef.current ? 0 : 500)
    instantQuoteRef.current = false
    return () => { clearTimeout(timer); ctrl.abort() }
    // name is only a label on the Shippo shipment; don't re-quote on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressReady, address1, address2, city, state, zip, country, items])

  // Keep the Elements amount in step with subtotal + selected shipping.
  useEffect(() => {
    if (elements && subtotal > 0) elements.update({ amount: subtotal + shippingCents })
  }, [elements, subtotal, shippingCents])

  // No wallets available → open card form automatically.
  useEffect(() => {
    if (expressAvailable === false) setCardOpen(true)
  }, [expressAvailable])

  // Focus the first empty field whenever the card form opens.
  useEffect(() => {
    if (!cardOpen || !cardFormRef.current) return
    const names = ['email', 'name', 'address-line1', 'address-level2', 'postal-code']
    for (const n of names) {
      const el = cardFormRef.current.elements.namedItem(n)
      if (el && !el.value.trim()) { el.focus(); break }
    }
  }, [cardOpen])

  async function handlePaymentSuccess(intentId, saved) {
    setPaymentIntentId(intentId)
    // Buying counts as joining: remember what was actually used (fills the
    // heart). A blank phone (US card orders) doesn't wipe a saved one.
    saveProfile({ ...saved, phone: saved.phone || undefined })
    if (saved.email) setEmail(saved.email)
    reset()

    // The order row is written by the Stripe webhook, which can lag the
    // confirmPayment() response by a second or two — poll briefly for it.
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const res = await fetch(`/api/orders/${intentId}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setOrder(data)
          break
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 1200))
    }
    setConfirmed(true)
  }

  async function handlePay(e) {
    e.preventDefault()
    if (loading) return
    const v = syncFromForm(e.currentTarget)
    if (v.country === 'US') v.phone = ''

    const errors = {}
    for (const field of FORM_FIELDS) {
      const msg = validateField(field, v[field], v.country)
      if (msg) errors[field] = msg
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      setCollapsed(false)
      setCardOpen(true)
      return setError('Please fix the highlighted fields')
    }
    if (!rate) {
      setCardOpen(true)
      return setError(ratesLoading ? 'Still calculating shipping…' : 'Choose a shipping method')
    }
    if (!stripe || !elements) return

    setError(null)
    setLoading(true)
    try {
      const { error: submitError } = await elements.submit()
      if (submitError) throw new Error(submitError.message || 'Check your card details')

      const address = {
        address1: v.address1, address2: v.address2, city: v.city,
        state: v.state, zip: v.zip, country: v.country,
      }
      const clientSecret = await createPaymentIntent({
        email: v.email, name: v.name, phone: v.phone || undefined, address, items: cartItems(items), rateId: rate.id,
      })

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl(),
          payment_method_data: {
            billing_details: {
              name: v.name,
              email: v.email,
              phone: v.phone || '',
              address: {
                line1: v.address1,
                line2: v.address2 || '',
                city: v.city,
                state: v.state || '',
                postal_code: v.zip,
                country: v.country,
              },
            },
          },
        },
        redirect: 'if_required',
      })
      if (confirmError) throw new Error(confirmError.message || 'Payment failed. Please try again.')
      if (!paymentIntent || !['succeeded', 'processing'].includes(paymentIntent.status)) {
        throw new Error('Payment didn’t complete. Please try again.')
      }
      await handlePaymentSuccess(paymentIntent.id, {
        email: v.email, name: v.name, phone: v.phone,
        address1: v.address1, address2: v.address2, city: v.city, state: v.state, zip: v.zip, country: v.country,
      })
    } catch (err) {
      setCardOpen(true)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Express checkout (Apple Pay / Google Pay / Link) ─────────────────────

  function onExpressClick({ resolve }) {
    // Collection flags (email, phone, shipping, countries) live on the
    // element options — Stripe deprecated them on click's resolve(). A
    // shipping rate is still required up front; the real ones replace this
    // placeholder as soon as the wallet sends a shipping address.
    resolve({ shippingRates: [{ id: 'pending', displayName: 'Shipping', amount: 0 }] })
  }

  async function onExpressShippingAddressChange({ address, resolve, reject }) {
    try {
      const next = await fetchRates({
        city: address.city,
        state: address.state,
        zip: address.postal_code,
        country: address.country,
        phone: address.country !== 'US' ? PLACEHOLDER_PHONE : undefined,
      }, items)
      if (!next.length) return reject()
      const shippingRates = next.map((r) => ({ id: r.id, displayName: rateLabel(r), amount: r.price }))
      elements?.update({ amount: subtotal + next[0].price })
      resolve({ shippingRates })
    } catch {
      reject()
    }
  }

  function onExpressShippingRateChange({ shippingRate, resolve }) {
    elements?.update({ amount: subtotal + shippingRate.amount })
    resolve()
  }

  function onExpressCancel() {
    // Put the amount back to what the card form shows.
    elements?.update({ amount: subtotal + shippingCents })
  }

  async function onExpressConfirm(event) {
    if (!stripe || !elements) return event.paymentFailed({ reason: 'fail' })
    const billing = event.billingDetails ?? {}
    const ship = event.shippingAddress ?? {}
    const shipAddr = ship.address ?? {}
    const rateId = event.shippingRate?.id
    if (!rateId || rateId === 'pending') return event.paymentFailed({ reason: 'invalid_shipping_address' })

    const saved = {
      email: billing.email || '',
      name: ship.name || billing.name || '',
      phone: billing.phone || '',
      address1: shipAddr.line1 || '',
      address2: shipAddr.line2 || '',
      city: shipAddr.city || '',
      state: shipAddr.state || '',
      zip: shipAddr.postal_code || '',
      country: shipAddr.country || '',
    }

    setError(null)
    setLoading(true)
    try {
      const { error: submitError } = await elements.submit()
      if (submitError) throw new Error(submitError.message || 'Payment failed')

      const clientSecret = await createPaymentIntent({
        email: saved.email,
        name: saved.name,
        phone: saved.phone || undefined,
        address: {
          address1: saved.address1, address2: saved.address2, city: saved.city,
          state: saved.state, zip: saved.zip, country: saved.country,
        },
        items: cartItems(items),
        rateId,
      })

      // Billing details come from the wallet — don't override them.
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: returnUrl() },
        redirect: 'if_required',
      })
      if (confirmError) throw new Error(confirmError.message || 'Payment failed')
      if (!paymentIntent || !['succeeded', 'processing'].includes(paymentIntent.status)) {
        throw new Error('Payment didn’t complete. Please try again.')
      }
      await handlePaymentSuccess(paymentIntent.id, saved)
    } catch (err) {
      event.paymentFailed({ reason: 'fail' })
      setError(err.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (confirmed) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          {order ? (
            <>
              <p style={{ margin: '0 0 6px', color: '#555', fontSize: 15 }}>
                Thank you, {order.name?.split(' ')[0] || 'friend'}!
              </p>
              <p style={{ margin: '0 0 32px', color: '#888', fontSize: 14 }}>
                A confirmation has been sent to {order.email ?? email}
              </p>
            </>
          ) : (
            <p style={{ margin: '0 0 32px', color: '#888', fontSize: 14 }}>
              Your payment went through — we're finalizing your order now. A confirmation will be sent to {email}.
            </p>
          )}
          <p style={{ margin: '0 0 24px', color: '#888', fontSize: 14 }}>
            Ships in {SHIP_DAYS_MIN}–{SHIP_DAYS_MAX} business days. We'll email tracking.
          </p>
          <a href="/" style={{ ...BTN, display: 'inline-block', textDecoration: 'none', padding: '14px 40px', width: 'auto' }}>
            Back to shop
          </a>
        </div>
      </div>
    )
  }

  const payTotal = subtotal + shippingCents
  // Link (Stripe's saved-card wallet) is left on: nothing here disables it.
  // The email is passed as a default so Link can recognise returning
  // customers, since the Payment Element doesn't collect email itself.
  const linkEmail = validateField('email', email, country) ? '' : email.trim()
  const paymentElementOptions = {
    fields: { billingDetails: { name: 'never', email: 'never', phone: 'never', address: 'never' } },
    defaultValues: { billingDetails: { email: linkEmail, name: name.trim() } },
  }
  const isUS = country === 'US'
  // Form is visible when no wallets (expressAvailable===false) or when cardOpen===true.
  // When expressAvailable is null (waiting for onReady) the form stays hidden until
  // we know whether wallets are present, so there's no premature flash.
  const showCardForm = expressAvailable === false || cardOpen

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px' }}>
      <div className="co-layout">

        {/* Mobile: compact, collapsible summary above the form */}
        <div className="co-summary-bar" style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee' }}>
          <button
            type="button"
            onClick={() => setSummaryOpen((o) => !o)}
            aria-expanded={summaryOpen}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: '#111' }}
          >
            <span>{summaryOpen ? 'Hide' : 'Show'} order summary {summaryOpen ? '▴' : '▾'}</span>
            <span>{money(payTotal)}</span>
          </button>
          {summaryOpen && (
            <div style={{ padding: '0 16px 16px' }}>
              <SummaryLines items={items} subtotal={subtotal} rate={rate} />
            </div>
          )}
        </div>

        {/* Left — checkout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Express wallets, hidden entirely if none are available */}
          <div style={{ display: expressAvailable === false ? 'none' : 'block', visibility: expressAvailable ? 'visible' : 'hidden' }}>
            <ExpressCheckoutElement
              options={{
                emailRequired: true,
                phoneNumberRequired: true,
                shippingAddressRequired: true,
                allowedShippingCountries: COUNTRY_CODES,
                paymentMethods: {
                  applePay: 'always',
                  googlePay: 'always',
                  link: 'never',
                  amazonPay: 'never',
                  klarna: 'never',
                  paypal: 'never',
                },
                buttonHeight: 48,
                layout: { maxColumns: 2, maxRows: 1 },
              }}
              onReady={({ availablePaymentMethods }) => {
                setExpressAvailable(Boolean(availablePaymentMethods && Object.values(availablePaymentMethods).some(Boolean)))
              }}
              onClick={onExpressClick}
              onShippingAddressChange={onExpressShippingAddressChange}
              onShippingRateChange={onExpressShippingRateChange}
              onCancel={onExpressCancel}
              onConfirm={onExpressConfirm}
            />
          </div>
          {expressAvailable === true && (
            <button
              type="button"
              onClick={() => setCardOpen((o) => !o)}
              aria-expanded={cardOpen}
              style={{
                ...INPUT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Pay with card</span>
              <span style={{
                display: 'inline-block',
                fontSize: 14,
                color: '#666',
                lineHeight: 1,
                transition: 'transform 0.2s ease',
                transform: cardOpen ? 'rotate(180deg)' : 'none',
              }}>▾</span>
            </button>
          )}

          {/* Animated card-form wrapper — inputs stay in the DOM when collapsed so
              Safari autofill and syncFromForm keep working. pointer-events:none
              blocks interaction without removing elements from the accessibility tree. */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: showCardForm ? '1fr' : '0fr',
              opacity: showCardForm ? 1 : 0,
              pointerEvents: showCardForm ? 'auto' : 'none',
              transition: 'grid-template-rows 0.2s ease, opacity 0.2s ease',
            }}
            aria-hidden={!showCardForm}
          >
          <div style={{ overflow: 'hidden' }}>
          <form ref={cardFormRef} onSubmit={handlePay} onInput={onFormInput} onAnimationStart={onFormAnimationStart} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 2 }}>
            {returning && (
              <div style={{ fontSize: 12, color: '#888', marginBottom: -12 }}>
                Not you?{' '}
                <button type="button" onClick={clearSaved} style={{ background: 'none', border: 'none', padding: 0, color: '#111', textDecoration: 'underline', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                  Clear
                </button>
              </div>
            )}
            {collapsed ? (
              <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: '#333' }}>
                  {shippingSummary({ name, address1, address2, city, state, zip, country, email })}
                </p>
                <button type="button" onClick={() => setCollapsed(false)} style={{ background: 'none', border: 'none', padding: 0, color: '#111', textDecoration: 'underline', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0 }}>
                  Edit
                </button>
              </div>
            ) : (<>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Field label="Email" htmlFor="co-email" error={fieldErrors.email}>
                <Input type="email" id="co-email" name="email" autoComplete="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => { setEmailFocused(false); onFieldBlur('email') }}
                  placeholder="jane@email.com" required />
              </Field>
              <EmailChips value={email} onChange={setEmail} focused={emailFocused} theme="light" />
            </div>
            <Field label="Full name" htmlFor="co-name" error={fieldErrors.name}>
              <Input id="co-name" name="name" autoComplete="shipping name" value={name} onChange={e => setName(e.target.value)} onBlur={() => onFieldBlur('name')} placeholder="Jane Doe" required />
            </Field>
            <Field label="Country" htmlFor="co-country">
              <Select id="co-country" name="country" autoComplete="shipping country" value={country} onChange={e => applyCountry(e.target.value, true)}>
                {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </Select>
            </Field>
            <Field label="Street Address" htmlFor="co-address-line1" error={fieldErrors.address1}>
              <Input id="co-address-line1" name="address-line1" autoComplete="shipping address-line1" value={address1} onChange={e => setAddress1(e.target.value)} onBlur={() => onFieldBlur('address1')} placeholder="123 Main St" required />
            </Field>
            <Field label="Apt, suite, etc. (optional)" htmlFor="co-address-line2">
              <Input id="co-address-line2" name="address-line2" autoComplete="shipping address-line2" value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Apt 4B" />
            </Field>
            <div className="co-row3">
              <Field label="City" htmlFor="co-city" error={fieldErrors.city}>
                <Input id="co-city" name="address-level2" autoComplete="shipping address-level2" value={city} onChange={e => setCity(e.target.value)} onBlur={() => onFieldBlur('city')} placeholder="Los Angeles" required />
              </Field>
              {isUS ? (
                <Field label="State" htmlFor="co-state" error={fieldErrors.state}>
                  <Select id="co-state" name="address-level1" autoComplete="shipping address-level1" value={state} onChange={e => setState(e.target.value)} onBlur={() => onFieldBlur('state')} required>
                    <option value="">—</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </Field>
              ) : (
                <Field label="State / Province" htmlFor="co-state">
                  <Input id="co-state" name="address-level1" autoComplete="shipping address-level1" value={state} onChange={e => setState(e.target.value)} placeholder="Province" />
                </Field>
              )}
              <Field label="ZIP / Postal" htmlFor="co-postal-code" error={fieldErrors.zip}>
                <Input id="co-postal-code" name="postal-code" autoComplete="shipping postal-code" inputMode={isUS ? 'numeric' : undefined} value={zip} onChange={e => setZip(e.target.value)} onBlur={() => onFieldBlur('zip')} placeholder="90001" required />
              </Field>
            </div>
            {!isUS && (
              <Field label="Phone (required for international shipping)" htmlFor="co-tel" error={fieldErrors.phone}>
                <Input type="tel" id="co-tel" name="tel" autoComplete="shipping tel" value={phone} onChange={e => setPhone(e.target.value)} onBlur={() => onFieldBlur('phone')} placeholder="+44 20 7946 0958" required />
              </Field>
            )}
            </>)}

            {/* Shipping method */}
            {ratesLoading && <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Calculating shipping…</p>}
            {!ratesLoading && ratesError && <p style={{ margin: 0, fontSize: 13, color: '#c00', fontWeight: 600 }}>{ratesError}</p>}
            {!ratesLoading && rates.length === 1 && (
              <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
                Shipping: {rateLabel(rates[0])} · <strong>{rates[0].price === 0 ? 'FREE' : money(rates[0].price)}</strong>
              </p>
            )}
            {!ratesLoading && rates.length > 1 && (
              <Field label="Shipping">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rates.map(r => (
                    <label key={r.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${selectedRate === r.id ? '#000' : '#e0e0e0'}`,
                      cursor: 'pointer', background: '#fff', fontSize: 14,
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="radio" name="rate" value={r.id} checked={selectedRate === r.id} onChange={() => setSelectedRate(r.id)} style={{ accentColor: '#000' }} />
                        <span>
                          <span style={{ fontWeight: 700 }}>{rateLabel(r)}</span>
                          {r.description && <span style={{ color: '#888', marginLeft: 6, fontSize: 12 }}>{r.description}</span>}
                        </span>
                      </span>
                      <span style={{ fontWeight: 700 }}>{r.price === 0 ? 'FREE' : money(r.price)}</span>
                    </label>
                  ))}
                </div>
              </Field>
            )}

            <Field label="Card details">
              <PaymentElement options={paymentElementOptions} />
            </Field>

            {error && <p style={{ margin: 0, fontSize: 13, color: '#c00', fontWeight: 600 }}>{error}</p>}

            <button type="submit" style={{ ...BTN, opacity: loading || !stripe ? 0.6 : 1 }} disabled={loading || !stripe}>
              {loading ? 'Processing…' : `Pay ${money(payTotal)}`}
            </button>
            <p style={{ margin: 0, fontSize: 12, color: '#888', textAlign: 'center' }}>
              🔒 Payments are processed securely by Stripe
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#bbb', textAlign: 'center' }}>
              <a href="/shipping" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Shipping</a>
              {' · '}
              <a href="/returns" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Returns</a>
              {' · '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy</a>
            </p>
          </form>
          </div>{/* overflow:hidden */}
          </div>{/* animated grid wrapper */}
        </div>

        {/* Right — order summary (desktop) */}
        <div className="co-summary-side" style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee', position: 'sticky', top: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#888' }}>
            Order Summary
          </h3>
          <SummaryLines items={items} subtotal={subtotal} rate={rate} />
        </div>
      </div>
    </div>
  )
}

/** "Shipping to Jane Doe, 123 Main St, Los Angeles, CA 90001 · jane@email.com" */
function shippingSummary({ name, address1, address2, city, state, zip, country, email }) {
  const countryName = country !== 'US' ? COUNTRIES.find(([code]) => code === country)?.[1] : null
  const parts = [name, [address1, address2].filter(Boolean).join(', '), city, [state, zip].filter(Boolean).join(' '), countryName]
  return `Shipping to ${parts.filter(Boolean).join(', ')} · ${email}`
}

function cartItems(items) {
  return items.map((i) => ({ variantId: i.variantId, qty: i.qty }))
}
