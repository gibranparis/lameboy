// src/components/NewsletterForm.jsx
// @ts-check
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { clearProfile, isSignedIn, saveProfile, useProfile } from '@/lib/profile'
import EmailChips from '@/components/EmailChips'

const CHAKRA_COLORS = [
  '#FF0000', // Root – red
  '#FF8C00', // Sacral – orange
  '#FFD700', // Solar Plexus – yellow
  '#00C853', // Heart – green
  '#00BFFF', // Throat – blue
  '#6A0DAD', // Third Eye – indigo
  '#EE82EE', // Crown – violet
]

function ChakraText({ text }) {
  return (
    <span aria-hidden="true" className="chakra-text">
      {text.split('').map((ch, i) => (
        <span key={i} style={{ color: CHAKRA_COLORS[i % 7] }}>{ch}</span>
      ))}
      <style jsx>{`
        .chakra-text { pointer-events: none; white-space: pre; }
      `}</style>
    </span>
  )
}

/**
 * Input with per-character chakra coloring.
 * Real placeholder is on the <input> (for autofill heuristics) but hidden
 * by CSS; the overlay div draws the visible one.
 * Autofill detection happens at the parent <form> level via onInput /
 * onAnimationStart — this component just renders and passes props through.
 */
function ChakraInput({
  inputRef, type, required, value, onChange, placeholder,
  autoComplete, name, id, inputMode, autoCapitalize, autoCorrect, spellCheck,
  onFocus, onBlur, onKeyDown,
}) {
  const localRef = useRef(null)
  const ref = inputRef || localRef

  return (
    <div className="ci-wrap">
      <div className="ci-display">
        {value
          ? <ChakraText text={value} />
          : <span className="ci-placeholder">{placeholder}</span>}
      </div>
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        spellCheck={spellCheck}
        className="ci-input"
      />
      <style jsx>{`
        .ci-wrap { position: relative; width: 100%; }
        .ci-display {
          position: absolute; inset: 0;
          display: flex; align-items: center;
          padding: 8px 10px; box-sizing: border-box;
          font-size: 14px; font-family: inherit;
          pointer-events: none; overflow: hidden; z-index: 1;
        }
        .ci-placeholder { color: rgba(255,255,255,0.25); }
        :global(html[data-theme='day']) .ci-placeholder { color: rgba(0,0,0,0.25); }

        /* Autofill detection: browser triggers this animation on :-webkit-autofill */
        @keyframes ciAutofill { from { opacity: 1; } to { opacity: 1; } }

        .ci-input {
          position: relative; width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 8px 10px;
          font-size: 14px; color: transparent; caret-color: #fff;
          outline: none; transition: border-color 0.15s ease; font-family: inherit;
        }
        /* Real placeholder hidden — overlay draws the visible one */
        .ci-input::placeholder { color: transparent; }

        .ci-input:-webkit-autofill,
        .ci-input:-webkit-autofill:hover,
        .ci-input:-webkit-autofill:focus {
          -webkit-text-fill-color: transparent;
          -webkit-box-shadow: 0 0 0 1000px rgba(255,255,255,0.06) inset;
          animation-name: ciAutofill;
          animation-duration: 0.01s;
        }
        :global(html[data-theme='day']) .ci-input:-webkit-autofill,
        :global(html[data-theme='day']) .ci-input:-webkit-autofill:hover,
        :global(html[data-theme='day']) .ci-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(0,0,0,0.04) inset;
        }

        .ci-input:focus { border-color: var(--banned-neon, #ff073a); }
        :global(html[data-theme='day']) .ci-input {
          background: rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.1);
          caret-color: #111;
        }
      `}</style>
    </div>
  )
}

// fieldName = HTML name attribute; form.elements.namedItem() uses it.
const EDIT_FIELDS = [
  { key: 'name',     label: 'Name',    type: 'text',  placeholder: 'Your name',      autoComplete: 'name',           fieldName: 'name',           id: 'pe-name',           autoCapitalize: 'words' },
  { key: 'email',    label: 'Email',   type: 'email', placeholder: 'you@email.com',  autoComplete: 'email',          fieldName: 'email',          id: 'pe-email',          inputMode: 'email', autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false },
  { key: 'phone',    label: 'Phone',   type: 'tel',   placeholder: '(555) 123-4567', autoComplete: 'tel',            fieldName: 'tel',            id: 'pe-tel',            inputMode: 'tel' },
  { key: 'address1', label: 'Street',  type: 'text',  placeholder: '123 Main St',    autoComplete: 'address-line1',  fieldName: 'address-line1',  id: 'pe-address-line1' },
  { key: 'address2', label: 'Apt',     type: 'text',  placeholder: 'Apt 4B',         autoComplete: 'address-line2',  fieldName: 'address-line2',  id: 'pe-address-line2' },
  { key: 'city',     label: 'City',    type: 'text',  placeholder: 'Los Angeles',    autoComplete: 'address-level2', fieldName: 'address-level2', id: 'pe-address-level2' },
  { key: 'state',    label: 'State',   type: 'text',  placeholder: 'CA',             autoComplete: 'address-level1', fieldName: 'address-level1', id: 'pe-address-level1' },
  { key: 'zip',      label: 'ZIP',     type: 'text',  placeholder: '90001',          autoComplete: 'postal-code',    fieldName: 'postal-code',    id: 'pe-postal-code' },
  { key: 'country',  label: 'Country', type: 'text',  placeholder: 'US',             autoComplete: 'country',        fieldName: 'country',        id: 'pe-country' },
]

function profileLines(p) {
  const street = [p.address1, p.address2].filter(Boolean).join(', ')
  const region = [p.state, p.zip].filter(Boolean).join(' ')
  const locality = [p.city, region].filter(Boolean).join(', ')
  return [p.name, p.email, p.phone, street, locality, p.country].filter(Boolean)
}

export default function NewsletterForm({ open, onClose }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(/** @type {Record<string,string>} */ ({}))
  const [joinEmailFocused, setJoinEmailFocused] = useState(false)
  const [editEmailFocused, setEditEmailFocused] = useState(false)
  const [joinEmailAutofilled, setJoinEmailAutofilled] = useState(false)
  const [editEmailAutofilled, setEditEmailAutofilled] = useState(false)
  const panelRef = useRef(null)
  const nameRef = useRef(null)
  const profile = useProfile()
  const signedIn = isSignedIn(profile)

  useEffect(() => { if (!open) setEditing(false) }, [open])

  useEffect(() => {
    if (open) requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    else setVisible(false)
  }, [open])

  // Desktop-only auto-focus: on touch devices iOS skips the keyboard and
  // AutoFill bar for programmatic focus, so let the user's tap focus it.
  useEffect(() => {
    if (!visible || !nameRef.current) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    nameRef.current.focus()
  }, [visible])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (e.target.closest('.heart-submit')) return
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    const t = setTimeout(() => window.addEventListener('pointerdown', onClick), 60)
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', onClick) }
  }, [open, onClose])

  // ── Join form ───────────────────────────────────────────────────────────────

  function syncJoinFromForm(form) {
    const n  = form.elements.namedItem('name')
    const em = form.elements.namedItem('email')
    const t  = form.elements.namedItem('tel')
    if (n)  setName(n.value)
    if (em) setEmail(em.value)
    if (t)  setPhone(t.value)
  }

  function onJoinInput(e) { syncJoinFromForm(e.currentTarget) }
  function onJoinAnimationStart(e) {
    if (e.animationName === 'ciAutofill') {
      if (e.target.name === 'email') setJoinEmailAutofilled(true)
      syncJoinFromForm(e.currentTarget)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Read DOM values directly — catches any autofill that bypassed onChange
    const form = e.currentTarget
    const nameVal  = (form.elements.namedItem('name')?.value  ?? name).trim()
    const emailVal = (form.elements.namedItem('email')?.value ?? email).trim()
    const phoneVal = (form.elements.namedItem('tel')?.value   ?? phone).trim()

    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()

    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameVal, email: emailVal, phone: phoneVal, ts: Date.now() }),
      })
    } catch {}

    saveProfile({ name: nameVal, email: emailVal, phone: phoneVal })
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setName(''); setEmail(''); setPhone('')
      onClose()
    }, 1800)
  }

  // ── Profile edit ────────────────────────────────────────────────────────────

  const startEdit = () => {
    const next = {}
    for (const { key } of EDIT_FIELDS) next[key] = profile?.[key] ?? ''
    setDraft(next)
    setEditing(true)
  }

  function syncEditFromForm(form) {
    setDraft((prev) => {
      const next = { ...prev }
      for (const { key, fieldName } of EDIT_FIELDS) {
        const el = form.elements.namedItem(fieldName)
        if (el) next[key] = el.value
      }
      return next
    })
  }

  function onEditInput(e) { syncEditFromForm(e.currentTarget) }
  function onEditAnimationStart(e) {
    if (e.animationName === 'ciAutofill') {
      if (e.target.name === 'email') setEditEmailAutofilled(true)
      syncEditFromForm(e.currentTarget)
    }
  }

  const saveEdit = (e) => {
    e.preventDefault()
    // Read DOM values directly
    const form = e.currentTarget
    const next = {}
    for (const { key, fieldName } of EDIT_FIELDS) {
      const el = form.elements.namedItem(fieldName)
      next[key] = String(el?.value ?? draft[key] ?? '').trim()
    }
    next.country = next.country.toUpperCase()
    saveProfile(next)
    setEditing(false)
  }

  const signOut = () => { clearProfile(); setEditing(false); onClose() }

  if (!open) return null

  const firstName = String(profile?.name ?? '').trim().split(/\s+/)[0] || ''

  return (
    <div
      ref={panelRef}
      className={`nl-panel ${visible ? 'nl-panel--visible' : ''}`}
      role="dialog"
      aria-label={signedIn && !submitted ? 'Your profile' : 'Newsletter signup'}
    >
      <button type="button" className="nl-close" onClick={onClose} aria-label="Close">&times;</button>

      {submitted ? (
        <div className="nl-thanks">let all mankind evolve</div>
      ) : signedIn && profile ? (
        <div className="nl-form">
          <div className="nl-title"><ChakraText text={`hi ${firstName}`.trim()} /></div>

          {editing ? (
            <form
              onSubmit={saveEdit}
              onInput={onEditInput}
              onAnimationStart={onEditAnimationStart}
              className="nl-form"
              autoComplete="on"
            >
              {EDIT_FIELDS.map(({ key, label, type, placeholder, autoComplete, fieldName, id, inputMode, autoCapitalize, autoCorrect, spellCheck }) => (
                <React.Fragment key={key}>
                  {key === 'email' ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label htmlFor={id} className="nl-label">
                        <span>{label}</span>
                        <ChakraInput
                          id={id}
                          name={fieldName}
                          type={type}
                          required
                          value={draft[key] ?? ''}
                          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                          onFocus={() => setEditEmailFocused(true)}
                          onBlur={() => setEditEmailFocused(false)}
                          onKeyDown={() => setEditEmailAutofilled(false)}
                          placeholder={placeholder}
                          autoComplete={autoComplete}
                          inputMode={inputMode}
                          autoCapitalize={autoCapitalize}
                          autoCorrect={autoCorrect}
                          spellCheck={spellCheck}
                        />
                      </label>
                      <EmailChips
                        value={draft[key] ?? ''}
                        onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
                        focused={editEmailFocused}
                        autofilled={editEmailAutofilled}
                        theme="dark"
                      />
                    </div>
                  ) : (
                    <label htmlFor={id} className="nl-label">
                      <span>{label}</span>
                      <ChakraInput
                        id={id}
                        name={fieldName}
                        type={type}
                        required={key === 'name'}
                        value={draft[key] ?? ''}
                        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        inputMode={inputMode}
                        autoCapitalize={autoCapitalize}
                        autoCorrect={autoCorrect}
                        spellCheck={spellCheck}
                      />
                    </label>
                  )}
                </React.Fragment>
              ))}
              <button type="submit" className="nl-submit">Save</button>
            </form>
          ) : (
            <div className="nl-lines">
              {profileLines(profile).map((line, i) => (
                <div key={i} className="nl-line">{line}</div>
              ))}
            </div>
          )}

          <div className="nl-actions">
            <button type="button" className="nl-link" onClick={editing ? () => setEditing(false) : startEdit}>
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button type="button" className="nl-link nl-link--quiet" onClick={signOut}>sign out</button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          onInput={onJoinInput}
          onAnimationStart={onJoinAnimationStart}
          name="join"
          method="post"
          className="nl-form"
          autoComplete="on"
        >
          <div className="nl-title"><ChakraText text="Join the list" /></div>

          <label htmlFor="nl-name" className="nl-label">
            <span>Name</span>
            <ChakraInput
              inputRef={nameRef}
              id="nl-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              autoCapitalize="words"
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="nl-email" className="nl-label">
              <span>Email</span>
              <ChakraInput
                id="nl-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setJoinEmailFocused(true)}
                onBlur={() => setJoinEmailFocused(false)}
                onKeyDown={() => setJoinEmailAutofilled(false)}
                placeholder="you@email.com"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
            <EmailChips value={email} onChange={setEmail} focused={joinEmailFocused} autofilled={joinEmailAutofilled} theme="dark" />
          </div>

          <label htmlFor="nl-tel" className="nl-label">
            <span>Phone</span>
            <ChakraInput
              id="nl-tel"
              name="tel"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              autoComplete="tel"
              inputMode="tel"
            />
          </label>

          <button type="submit" className="nl-submit">Start</button>
        </form>
      )}

      <style jsx>{`
        .nl-panel {
          position: fixed;
          right: max(var(--header-pad-x, 16px), env(safe-area-inset-right));
          top: calc(var(--safe-top, 0px) + 12px + 44px + 8px);
          width: 260px;
          background: rgba(18,18,18,0.92);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px;
          z-index: 10009;
          opacity: 0;
          transform: scale(0);
          transform-origin: top right;
          transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          box-shadow: 0 8px 32px rgba(0,0,0,0.45);
          max-height: calc(100dvh - var(--safe-top, 0px) - 12px - 44px - 8px - 16px);
          overflow-y: auto;
        }

        .nl-close {
          position: absolute; top: 8px; right: 8px;
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none; border-radius: 50%;
          color: rgba(255,255,255,0.45); font-size: 18px; line-height: 1;
          cursor: pointer; padding: 0;
          transition: color 0.15s ease, background 0.15s ease; z-index: 1;
        }
        .nl-close:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.08); }
        .nl-close:active { opacity: 0.6; }
        :global(html[data-theme='day']) .nl-close { color: rgba(0,0,0,0.35); }
        :global(html[data-theme='day']) .nl-close:hover { color: rgba(0,0,0,0.7); background: rgba(0,0,0,0.06); }

        .nl-panel--visible { opacity: 1; transform: scale(1); pointer-events: auto; }

        :global(html[data-theme='day']) .nl-panel {
          background: rgba(255,255,255,0.92);
          border-color: rgba(0,0,0,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }

        .nl-title {
          font-size: 15px; font-weight: 700;
          letter-spacing: 0.02em; margin-bottom: 14px; color: #fff;
        }
        :global(html[data-theme='day']) .nl-title { color: #111; }

        .nl-form { display: flex; flex-direction: column; gap: 10px; }

        .nl-label {
          display: flex; flex-direction: column; gap: 3px;
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: rgba(255,255,255,0.5);
        }
        :global(html[data-theme='day']) .nl-label { color: rgba(0,0,0,0.45); }

        .nl-submit {
          margin-top: 4px; padding: 12px 0;
          background: var(--hover-green, #0bf05f); color: #000;
          border: none; outline: none; border-radius: 28px;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase;
          cursor: pointer; transition: opacity 0.15s ease;
          font-family: inherit; -webkit-tap-highlight-color: transparent;
        }
        .nl-submit:hover { opacity: 0.85; }
        .nl-submit:active { opacity: 0.65; }

        .nl-lines {
          display: flex; flex-direction: column; gap: 4px;
          font-size: 13px; line-height: 1.4;
          color: rgba(255,255,255,0.8); word-break: break-word;
        }
        :global(html[data-theme='day']) .nl-lines { color: rgba(0,0,0,0.75); }

        .nl-actions {
          display: flex; justify-content: space-between;
          align-items: center; margin-top: 6px;
        }

        .nl-link {
          background: none; border: none; padding: 0;
          font-family: inherit; font-size: 12px; font-weight: 700;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: #ff69b4; cursor: pointer;
        }
        .nl-link--quiet {
          font-weight: 500; text-transform: none; letter-spacing: 0;
          color: rgba(255,255,255,0.45); text-decoration: underline;
        }
        :global(html[data-theme='day']) .nl-link--quiet { color: rgba(0,0,0,0.45); }

        .nl-thanks {
          text-align: center; font-size: 15px; font-weight: 700;
          color: var(--hover-green, #0bf05f); padding: 18px 0;
        }
      `}</style>
    </div>
  )
}
