// src/components/NewsletterForm.jsx
// @ts-check
'use client'

import React, { useState, useRef, useEffect } from 'react'

const CHAKRA_COLORS = [
  '#FF0000', // Root – red
  '#FF8C00', // Sacral – orange
  '#FFD700', // Solar Plexus – yellow
  '#00C853', // Heart – green
  '#00BFFF', // Throat – blue
  '#6A0DAD', // Third Eye – indigo
  '#EE82EE', // Crown – violet
]

/**
 * Renders text with each character cycling through the 7 chakra colors.
 * @param {{ text: string }} props
 */
function ChakraText({ text }) {
  return (
    <span aria-hidden="true" className="chakra-text">
      {text.split('').map((ch, i) => (
        <span key={i} style={{ color: CHAKRA_COLORS[i % 7] }}>{ch}</span>
      ))}
      <style jsx>{`
        .chakra-text {
          pointer-events: none;
          white-space: pre;
        }
      `}</style>
    </span>
  )
}

/**
 * Input that shows each character in a cycling chakra color.
 * Uses a transparent-text real input overlaid on a colored display span.
 * Detects browser autofill via CSS animation trick + polling.
 */
function ChakraInput({ inputRef, type, required, value, onChange, placeholder, autoComplete }) {
  const localRef = useRef(null)
  const ref = inputRef || localRef

  // Detect autofill: browsers bypass onChange, so we poll when autofill animation fires
  useEffect(() => {
    const el = ref.current
    if (!el) return

    let pollId = 0

    const syncValue = () => {
      if (el.value && el.value !== value) {
        // Create a synthetic-like event for the parent onChange
        const nativeEvent = new Event('input', { bubbles: true })
        Object.defineProperty(nativeEvent, 'target', { value: el })
        onChange({ target: el, currentTarget: el, nativeEvent })
      }
    }

    // CSS animation fires on :-webkit-autofill, start polling to catch the value
    const onAnimStart = (e) => {
      if (e.animationName === 'ciAutofill') {
        // Poll briefly — browsers fill the value slightly after the animation fires
        let attempts = 0
        const poll = () => {
          syncValue()
          attempts++
          if (attempts < 12) pollId = requestAnimationFrame(poll)
        }
        poll()
      }
    }

    el.addEventListener('animationstart', onAnimStart)

    // Also catch via input event (some browsers fire this on autofill)
    const onInput = () => syncValue()
    el.addEventListener('input', onInput)

    return () => {
      el.removeEventListener('animationstart', onAnimStart)
      el.removeEventListener('input', onInput)
      cancelAnimationFrame(pollId)
    }
  }, [ref, value, onChange])

  return (
    <div className="ci-wrap">
      <div className="ci-display">
        {value ? <ChakraText text={value} /> : <span className="ci-placeholder">{placeholder}</span>}
      </div>
      <input
        ref={ref}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder=""
        autoComplete={autoComplete}
        className="ci-input"
      />
      <style jsx>{`
        .ci-wrap {
          position: relative;
          width: 100%;
        }
        .ci-display {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          padding: 8px 10px;
          font-size: 14px;
          font-family: inherit;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }
        .ci-placeholder {
          color: rgba(255, 255, 255, 0.25);
        }
        :global(html[data-theme='day']) .ci-placeholder {
          color: rgba(0, 0, 0, 0.25);
        }

        /* Autofill detection: browser triggers this animation on autofill */
        @keyframes ciAutofill {
          from { opacity: 1; }
          to { opacity: 1; }
        }

        .ci-input {
          position: relative;
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 14px;
          color: transparent;
          caret-color: #fff;
          outline: none;
          transition: border-color 0.15s ease;
          font-family: inherit;
        }

        /* Override browser autofill styling so our chakra overlay stays visible */
        .ci-input:-webkit-autofill,
        .ci-input:-webkit-autofill:hover,
        .ci-input:-webkit-autofill:focus {
          -webkit-text-fill-color: transparent;
          -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.06) inset;
          animation-name: ciAutofill;
          animation-duration: 0.01s;
        }
        :global(html[data-theme='day']) .ci-input:-webkit-autofill,
        :global(html[data-theme='day']) .ci-input:-webkit-autofill:hover,
        :global(html[data-theme='day']) .ci-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.04) inset;
        }

        .ci-input:focus {
          border-color: var(--banned-neon, #ff073a);
        }
        :global(html[data-theme='day']) .ci-input {
          background: rgba(0, 0, 0, 0.04);
          border-color: rgba(0, 0, 0, 0.1);
          caret-color: #111;
        }
      `}</style>
    </div>
  )
}

/**
 * Newsletter signup form that slides up from the heart button.
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function NewsletterForm({ open, onClose }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef(null)
  const nameRef = useRef(null)

  // animate in/out
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
    }
  }, [open])

  // focus name field when opened
  useEffect(() => {
    if (visible && nameRef.current) {
      nameRef.current.focus()
    }
  }, [visible])

  // close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // close on click outside
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    const t = setTimeout(() => window.addEventListener('pointerdown', onClick), 60)
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', onClick)
    }
  }, [open, onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: wire to actual newsletter API
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setName('')
      setEmail('')
      setPhone('')
      onClose()
    }, 1800)
  }

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className={`nl-panel ${visible ? 'nl-panel--visible' : ''}`}
      role="dialog"
      aria-label="Newsletter signup"
    >
      <button
        type="button"
        className="nl-close"
        onClick={onClose}
        aria-label="Close"
      >
        &times;
      </button>

      {submitted ? (
        <div className="nl-thanks">Thanks for subscribing!</div>
      ) : (
        <form onSubmit={handleSubmit} className="nl-form">
          <div className="nl-title"><ChakraText text="Join the list" /></div>

          <label className="nl-label">
            <span>Name</span>
            <ChakraInput
              inputRef={nameRef}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

          <label className="nl-label">
            <span>Email</span>
            <ChakraInput
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </label>

          <label className="nl-label">
            <span>Phone</span>
            <ChakraInput
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              autoComplete="tel"
            />
          </label>

          <button type="submit" className="nl-submit">Subscribe</button>
        </form>
      )}

      <style jsx>{`
        .nl-panel {
          position: fixed;
          right: max(var(--header-pad-x, 16px), env(safe-area-inset-right));
          top: calc(var(--safe-top, 0px) + 12px + 44px + 8px);
          width: 260px;
          background: rgba(18, 18, 18, 0.92);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          z-index: 10009;
          opacity: 0;
          transform: scale(0);
          transform-origin: top right;
          transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
        }

        .nl-close {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.45);
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease, background 0.15s ease;
          z-index: 1;
        }

        .nl-close:hover {
          color: rgba(255, 255, 255, 0.85);
          background: rgba(255, 255, 255, 0.08);
        }

        .nl-close:active {
          opacity: 0.6;
        }

        :global(html[data-theme='day']) .nl-close {
          color: rgba(0, 0, 0, 0.35);
        }

        :global(html[data-theme='day']) .nl-close:hover {
          color: rgba(0, 0, 0, 0.7);
          background: rgba(0, 0, 0, 0.06);
        }

        .nl-panel--visible {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }

        :global(html[data-theme='day']) .nl-panel {
          background: rgba(255, 255, 255, 0.92);
          border-color: rgba(0, 0, 0, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        .nl-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin-bottom: 14px;
          color: #fff;
        }

        :global(html[data-theme='day']) .nl-title {
          color: #111;
        }

        .nl-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .nl-label {
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.5);
        }

        :global(html[data-theme='day']) .nl-label {
          color: rgba(0, 0, 0, 0.45);
        }

        .nl-submit {
          margin-top: 4px;
          padding: 9px 0;
          background: #ff69b4;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s ease, background 0.15s ease;
          font-family: inherit;
        }

        .nl-submit:hover {
          background: #ff85c8;
          opacity: 0.92;
        }

        .nl-submit:active {
          opacity: 0.75;
        }

        .nl-thanks {
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          color: var(--hover-green, #0bf05f);
          padding: 18px 0;
        }
      `}</style>
    </div>
  )
}
