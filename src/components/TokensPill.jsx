// src/components/TokensPill.jsx
// @ts-check
'use client'

import { useRef } from 'react'
import { useTokenCount } from '@/components/TokensMeter'
import { useDragSnap, pinball } from '@/lib/dragSnap'

/**
 * The tokens meter in miniature, for a signed-in customer: a pill under the
 * heart whose fill is the cart's progress toward free shipping, with the
 * token count rolling inside it like a score (and a "+N" when it grows).
 * Green while it fills, blue once free shipping is unlocked. Like everything
 * else on the shop page it can be dragged and parked, or flicked to pinball
 * around; a tap opens the heart panel with the full meter.
 * @param {{ tokens: number, goal: number, hidden?: boolean, onOpen?: () => void }} props
 */
export default function TokensPill({ tokens, goal, hidden = false, onOpen }) {
  const ref = useRef(/** @type {HTMLButtonElement | null} */ (null))
  useDragSnap(ref, { touchAction: 'none', key: 'tokens-pill', stayOnTap: true, fling: pinball })

  const { val, gain } = useTokenCount({ tokens })
  const shown = Math.round(val)
  const percent = goal > 0 ? Math.min(100, (val / goal) * 100) : 0
  const done = tokens >= goal && shown >= goal

  return (
    <button
      ref={ref}
      type="button"
      data-tokens-pill
      className={`tk-pill ${done ? 'tk-pill--done' : ''} ${hidden ? 'tk-pill--hidden' : ''}`}
      aria-label={done ? `${tokens} tokens: free shipping unlocked` : `${tokens} of ${goal} tokens toward free shipping`}
      title="Tokens"
      onClick={onOpen}
    >
      <span className="tk-fill" style={{ width: `${percent > 0 ? Math.max(percent, 8) : 0}%` }} aria-hidden="true" />
      <span className="tk-count" aria-hidden="true">{done ? '★ ' : ''}{shown.toLocaleString('en-US')}</span>
      {gain && <span key={gain.key} className="tk-gain" aria-hidden="true">+{gain.n.toLocaleString('en-US')}</span>}
      <style jsx>{`
        .tk-pill {
          position: fixed;
          /* centred under the heart (44px, at the right of the top row) */
          top: calc(var(--safe-top, 0px) + var(--header-ctrl, 64px) - 4px);
          right: calc(max(var(--header-pad-x, 16px), env(safe-area-inset-right)) - 4px);
          z-index: 9991;
          width: 52px;
          height: 20px;
          padding: 0;
          border: 0;
          border-radius: 9999px;
          overflow: visible;
          background: rgba(0,0,0,0.07);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.1);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.25s ease;
        }
        :global(html[data-theme='night']) .tk-pill {
          background: rgba(255,255,255,0.1);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), 0 4px 12px rgba(0,0,0,0.4);
        }
        .tk-pill--hidden { opacity: 0; pointer-events: none; }
        .tk-fill {
          position: absolute; left: 0; top: 0; bottom: 0;
          border-radius: inherit;
          background: linear-gradient(90deg, #08c94f, var(--hover-green, #0bf05f) 60%, #7dffb0);
          box-shadow: 0 0 8px rgba(11,240,95,0.45);
          transition: background 0.45s ease, box-shadow 0.45s ease;
        }
        .tk-pill--done .tk-fill {
          background: linear-gradient(90deg, #1f5fe0, #3d8bff 60%, #8fd0ff);
          box-shadow: 0 0 10px rgba(61,139,255,0.6);
        }
        .tk-pill--done { animation: tk-levelup 0.55s cubic-bezier(0.3, 1.6, 0.5, 1); }
        @keyframes tk-levelup {
          0% { transform: scale(1); }
          35% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        .tk-count {
          position: relative;
          display: block;
          font-size: 10px; font-weight: 800; letter-spacing: 0.02em; line-height: 20px;
          font-variant-numeric: tabular-nums;
          text-align: center; white-space: nowrap;
          color: #111;
          text-shadow: 0 0 4px rgba(255,255,255,0.7);
        }
        :global(html[data-theme='night']) .tk-count { color: #fff; text-shadow: 0 0 4px rgba(0,0,0,0.6); }
        /* what was just earned drops out from under the pill */
        .tk-gain {
          position: absolute; left: 50%; top: 100%;
          font-size: 10px; font-weight: 800; white-space: nowrap;
          color: #08a443;
          pointer-events: none;
          animation: tk-gain 1.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        :global(html[data-theme='night']) .tk-gain { color: var(--hover-green, #0bf05f); text-shadow: 0 0 8px rgba(11,240,95,0.55); }
        @keyframes tk-gain {
          0% { opacity: 0; transform: translate(-50%, -4px) scale(0.8); }
          18% { opacity: 1; transform: translate(-50%, 2px) scale(1.15); }
          70% { opacity: 1; transform: translate(-50%, 6px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, 12px) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tk-pill--done, .tk-gain { animation: none; }
        }
      `}</style>
    </button>
  )
}
