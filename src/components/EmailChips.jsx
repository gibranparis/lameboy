// src/components/EmailChips.jsx
// Shared email-domain chip row + typo hint for newsletter and checkout forms.
'use client'

import { useEffect, useRef, useState } from 'react'

const DOMAINS = ['gmail.com', 'icloud.com', 'yahoo.com', 'outlook.com']

const TYPO_MAP = {
  'gmial.com':  'gmail.com',
  'gmai.com':   'gmail.com',
  'gamil.com':  'gmail.com',
  'gmail.co':   'gmail.com',
  'icloud.co':  'icloud.com',
  'iclod.com':  'icloud.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com':   'yahoo.com',
  'outlok.com': 'outlook.com',
  'hotmial.com':'outlook.com',
}

const CHAKRA = ['#FF0000','#FF8C00','#FFD700','#00C853','#00BFFF','#6A0DAD','#EE82EE']

function ChipText({ text }) {
  return <>{text.split('').map((ch, i) => <span key={i} style={{ color: CHAKRA[i % 7] }}>{ch}</span>)}</>
}

function getChips(value) {
  if (!value) return []
  const atIdx = value.indexOf('@')
  if (atIdx === -1) {
    return DOMAINS.map(d => ({ label: `@${d}`, full: value + '@' + d }))
  }
  const afterAt = value.slice(atIdx + 1)
  if (DOMAINS.includes(afterAt)) return [] // exact match — domain is complete
  // Typing a custom domain: has a dot after @ but no DOMAIN prefix matches
  if (afterAt.includes('.') && !DOMAINS.some(d => d.startsWith(afterAt))) return []
  const beforeAt = value.slice(0, atIdx)
  return DOMAINS
    .filter(d => d.startsWith(afterAt))
    .map(d => ({ label: d, full: beforeAt + '@' + d }))
}

/**
 * Email domain chips + typo hint.
 *
 * @param {{
 *   value: string,
 *   onChange: (newValue: string) => void,
 *   focused: boolean,
 *   theme?: 'dark' | 'light',
 * }} props
 */
export default function EmailChips({ value, onChange, focused, theme = 'light' }) {
  const chips = focused && value ? getChips(value) : []
  const show = chips.length > 0

  const valueRef = useRef(value)
  valueRef.current = value
  const [typo, setTypo] = useState(null)

  // Check for typo domain only when focus is lost; clear it when focus returns.
  useEffect(() => {
    if (focused) { setTypo(null); return }
    const v = valueRef.current
    const atIdx = v.indexOf('@')
    if (atIdx !== -1) {
      const domain = v.slice(atIdx + 1).toLowerCase()
      const fix = TYPO_MAP[domain]
      setTypo(fix ? v.slice(0, atIdx + 1) + fix : null)
    } else {
      setTypo(null)
    }
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
              onPointerDown={e => e.preventDefault()} // keeps keyboard open on mobile
              onClick={() => onChange(full)}
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
        .ec-chip--light {
          border-color: #e0e0e0;
        }
        :global(html[data-theme='day']) .ec-chip--dark {
          border-color: rgba(0,0,0,0.12);
        }

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
