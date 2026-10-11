// src/components/EmailChips.jsx
// Shared email-domain chip row + typo hint for newsletter and checkout forms.
'use client'

import { useEffect, useRef, useState } from 'react'

// Full autocomplete pool (chip filtering + exact-match guard)
const ALL_DOMAINS = [
  'gmail.com', 'icloud.com', 'yahoo.com', 'outlook.com',
  'hotmail.com', 'aol.com', 'live.com', 'me.com', 'msn.com', 'comcast.net', 'proton.me',
]

// Provider name → canonical full domain (for typo corrections)
const PROVIDER_DOMAIN = {
  gmail: 'gmail.com', icloud: 'icloud.com', yahoo: 'yahoo.com',
  outlook: 'outlook.com', hotmail: 'hotmail.com', aol: 'aol.com',
  live: 'live.com', me: 'me.com', msn: 'msn.com',
  comcast: 'comcast.net', proton: 'proton.me',
}

// Provider-name typos → corrected provider name
const PROVIDER_TYPOS = {
  gmial: 'gmail', gmai: 'gmail', gamil: 'gmail', gmal: 'gmail', gnail: 'gmail', gmali: 'gmail',
  iclod: 'icloud', icoud: 'icloud', icluod: 'icloud',
  yahooo: 'yahoo', yaho: 'yahoo', yhoo: 'yahoo', yahho: 'yahoo',
  outlok: 'outlook', outloo: 'outlook', otlook: 'outlook',
  hotmial: 'hotmail', hotmal: 'hotmail', hotmai: 'hotmail', hotmil: 'hotmail',
}

// TLD typos that should become .com (only applied to known .com providers)
const TLD_TYPO_TO_COM = new Set(['con', 'cm', 'comm', 'om', 'vom', 'xom', 'co'])

/** Returns the corrected email, or null if no fixable typo is found. */
function findTypoFix(email) {
  const atIdx = email.indexOf('@')
  if (atIdx === -1) return null
  const beforeAt = email.slice(0, atIdx)
  const domain = email.slice(atIdx + 1).toLowerCase()
  if (!domain) return null
  if (ALL_DOMAINS.includes(domain)) return null // already correct

  const dotIdx = domain.indexOf('.')

  if (dotIdx === -1) {
    // No TLD — suggest adding it for known .com providers
    const correctDomain = PROVIDER_DOMAIN[domain]
    if (correctDomain && correctDomain.endsWith('.com')) return beforeAt + '@' + correctDomain
    // Provider typo with no TLD
    const fixedProvider = PROVIDER_TYPOS[domain]
    if (fixedProvider) return beforeAt + '@' + PROVIDER_DOMAIN[fixedProvider]
    return null
  }

  const provider = domain.slice(0, dotIdx)
  const tld = domain.slice(dotIdx + 1)

  // Provider typo (TLD may or may not also be wrong — use canonical domain)
  const fixedProvider = PROVIDER_TYPOS[provider]
  if (fixedProvider) return beforeAt + '@' + PROVIDER_DOMAIN[fixedProvider]

  // Known provider with a TLD typo
  const correctDomain = PROVIDER_DOMAIN[provider]
  if (correctDomain) {
    const correctTld = correctDomain.split('.')[1]
    if (correctTld === 'com' && TLD_TYPO_TO_COM.has(tld)) return beforeAt + '@' + correctDomain
  }

  return null
}

// Device-ordered default domains for the pre-@ chips.
// iOS/iPadOS (including iPad on macOS in desktop mode) puts icloud.com second.
function getDeviceDefaultDomains() {
  if (typeof navigator === 'undefined') {
    return ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'] // SSR fallback
  }
  const ua = navigator.userAgent || ''
  const plat = navigator.platform || ''
  const isApple = /iP(hone|ad|od)/i.test(ua) || (/Mac/i.test(plat) && navigator.maxTouchPoints > 1)
  return isApple
    ? ['gmail.com', 'icloud.com', 'yahoo.com', 'outlook.com']
    : ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com']
}

function getChips(value) {
  if (!value) return []
  const defaultDomains = getDeviceDefaultDomains()
  const atIdx = value.indexOf('@')

  if (atIdx === -1) {
    // Before @: show the 4 device-ordered defaults
    return defaultDomains.map(d => ({ label: `@${d}`, full: value + '@' + d }))
  }

  // Lowercase the typed domain for all comparisons; keep beforeAt as typed
  const beforeAt = value.slice(0, atIdx)
  const afterAtLower = value.slice(atIdx + 1).toLowerCase()

  if (ALL_DOMAINS.includes(afterAtLower)) return [] // domain is complete

  // Typing a custom domain: has a dot but no ALL_DOMAINS entry starts with it
  if (afterAtLower.includes('.') && !ALL_DOMAINS.some(d => d.startsWith(afterAtLower))) return []

  // Filter by prefix, sort default-chip domains first, show up to 4
  const matches = ALL_DOMAINS.filter(d => d.startsWith(afterAtLower))
  matches.sort((a, b) => {
    const ai = defaultDomains.indexOf(a)
    const bi = defaultDomains.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return 0
  })

  return matches.slice(0, 4).map(d => ({ label: d, full: beforeAt + '@' + d }))
}

// Safari blurs the input on the chip press, before the click arrives. Chips
// stay up this long after a blur so that click still lands on them.
const BLUR_LINGER_MS = 300

const CHAKRA = ['#FF0000','#FF8C00','#FFD700','#00C853','#00BFFF','#6A0DAD','#EE82EE']

function ChipText({ text }) {
  return <>{text.split('').map((ch, i) => <span key={i} style={{ color: CHAKRA[i % 7] }}>{ch}</span>)}</>
}

/**
 * Email domain chips + typo hint.
 *
 * @param {{
 *   value: string,
 *   onChange: (newValue: string) => void,
 *   focused: boolean,
 *   autofilled?: boolean,
 *   theme?: 'dark' | 'light',
 * }} props
 */
export default function EmailChips({ value, onChange, focused, autofilled = false, theme = 'light' }) {
  // Set in render (not an effect) on the focused → blurred step, so the chip
  // buttons are never unmounted between the press and the click
  const [prevFocused, setPrevFocused] = useState(focused)
  const [lingering, setLingering] = useState(false)
  if (prevFocused !== focused) {
    setPrevFocused(focused)
    setLingering(!focused)
  }
  useEffect(() => {
    if (!lingering) return
    const t = setTimeout(() => setLingering(false), BLUR_LINGER_MS)
    return () => clearTimeout(t)
  }, [lingering])

  // Suppress chips immediately after an autofill event; next keydown clears it.
  const chips = (focused || lingering) && value && !autofilled ? getChips(value) : []
  const show = chips.length > 0

  const valueRef = useRef(value)
  valueRef.current = value
  const [typo, setTypo] = useState(null)

  // Check for typo domain only when focus is lost; clear on focus return.
  useEffect(() => {
    if (focused) { setTypo(null); return }
    const v = valueRef.current
    const fix = findTypoFix(v)
    setTypo(fix)
  }, [focused]) // eslint-disable-line react-hooks/exhaustive-deps

  const dark = theme === 'dark'

  return (
    <>
      {show && (
        <div className="ec-row">
          {chips.map(({ label, full }) => (
            <button
              key={full}
              type="button"
              className={`ec-chip ${dark ? 'ec-chip--dark' : 'ec-chip--light'}`}
              // Keep the input focused (and the keyboard open). Safari needs
              // mousedown too — it ignores this on pointerdown.
              onPointerDown={e => e.preventDefault()}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setLingering(false); onChange(full) }}
            >
              <ChipText text={label} />
            </button>
          ))}
        </div>
      )}
      {!focused && typo && (
        <p className={`ec-typo ${dark ? 'ec-typo--dark' : 'ec-typo--light'}`}>
          did you mean{' '}
          <button
            type="button"
            className="ec-typo-btn"
            onPointerDown={e => e.preventDefault()}
            onClick={() => { onChange(typo); setTypo(null) }}
          >
            {typo}
          </button>
          ?
        </p>
      )}
      <style jsx>{`
        .ec-row {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
          margin-top: 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .ec-row::-webkit-scrollbar { display: none; }
        @keyframes ecFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ec-row { animation: ecFadeIn 0.12s ease; }

        .ec-chip {
          flex-shrink: 0;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.18);
          background: transparent;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          font-family: inherit;
          line-height: 1.4;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }
        .ec-chip--light { border-color: #e0e0e0; }
        :global(html[data-theme='day']) .ec-chip--dark { border-color: rgba(0,0,0,0.12); }

        .ec-typo {
          margin: 4px 0 0;
          font-size: 12px;
          line-height: 1.4;
          color: rgba(255,255,255,0.5);
        }
        .ec-typo--light { color: #888; }
        :global(html[data-theme='day']) .ec-typo--dark { color: rgba(0,0,0,0.5); }
        .ec-typo-btn {
          background: none; border: none; padding: 0;
          cursor: pointer; font-size: 12px; font-family: inherit;
          font-weight: 700; text-decoration: underline; color: inherit;
        }
      `}</style>
    </>
  )
}
