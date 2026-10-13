// src/components/TokensPill.jsx
// @ts-check
'use client'

import { useRef } from 'react'
import { useTokenCount } from '@/components/TokensMeter'
import { useDragSnap, pinball } from '@/lib/dragSnap'

const SLASHES = 10 // one per 10% of the way to free shipping

/**
 * The tokens meter in miniature, for a signed-in customer: a clean little
 * pill under the heart with a row of progression slashes, one per 10% of the
 * way to free shipping. They light up one by one as the cart's tokens roll
 * in (the one in progress fills partway, and each pops as it completes), a
 * "+N" drops out when it grows, and once free shipping is unlocked they all
 * turn blue with a star. Like everything else on the shop page it can be
 * dragged and parked, or flicked to pinball around; a tap opens the heart
 * panel with the full meter and the count. The page decides when it's up
 * (`hidden`); onHold tells it while the pill itself is being moved.
 * @param {{ tokens: number, goal: number, hidden?: boolean, onOpen?: () => void, onHold?: (held: boolean) => void }} props
 */
export default function TokensPill({ tokens, goal, hidden = false, onOpen, onHold }) {
  const ref = useRef(/** @type {HTMLButtonElement | null} */ (null))
  const onHoldRef = useRef(onHold)
  onHoldRef.current = onHold
  useDragSnap(ref, {
    touchAction: 'none',
    key: 'tokens-pill',
    stayOnTap: true,
    fling: pinball,
    onLift: (lifted) => onHoldRef.current?.(lifted),
  })

  const { val, gain } = useTokenCount({ tokens })
  const shown = Math.round(val)
  const progress = goal > 0 ? Math.min(1, val / goal) * SLASHES : 0 // slashes lit, fractional
  const done = tokens >= goal && shown >= goal
  const label = done
    ? `${tokens.toLocaleString('en-US')} tokens: free shipping unlocked`
    : `${tokens.toLocaleString('en-US')} of ${goal.toLocaleString('en-US')} tokens toward free shipping`

  return (
    <button
      ref={ref}
      type="button"
      data-tokens-pill
      className={`tk-pill ${done ? 'tk-pill--done' : ''} ${hidden ? 'tk-pill--hidden' : ''}`}
      aria-label={label}
      title={label}
      onClick={onOpen}
    >
      <span className="tk-slashes" aria-hidden="true">
        {Array.from({ length: SLASHES }, (_, i) => {
          const f = Math.max(0, Math.min(1, progress - i))
          return (
            <span key={i} className={`tk-slash ${f >= 1 ? 'tk-slash--full' : ''}`}>
              <span className="tk-slash-fill" style={{ width: `${(f * 100).toFixed(1)}%` }} />
            </span>
          )
        })}
      </span>
      {done && <span className="tk-star" aria-hidden="true">★</span>}
      {gain && <span key={gain.key} className="tk-gain" aria-hidden="true">+{gain.n.toLocaleString('en-US')}</span>}
      <style jsx>{`
        .tk-pill {
          position: fixed;
          /* centred under the heart (44px, at the right of the top row) */
          top: calc(var(--safe-top, 0px) + var(--header-ctrl, 64px) - 4px);
          right: calc(max(var(--header-pad-x, 16px), env(safe-area-inset-right)) - 6px);
          z-index: 9991;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 18px;
          padding: 0 7px;
          box-sizing: border-box;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 9999px;
          overflow: visible;
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.25s ease, box-shadow 0.45s ease;
        }
        :global(html[data-theme='night']) .tk-pill {
          border-color: rgba(255,255,255,0.12);
          background: rgba(22,22,22,0.72);
          box-shadow: 0 3px 12px rgba(0,0,0,0.45);
        }
        .tk-pill--hidden { opacity: 0; pointer-events: none; }
        .tk-pill--done { box-shadow: 0 0 12px rgba(61,139,255,0.45); }
        .tk-pill--done { animation: tk-levelup 0.55s cubic-bezier(0.3, 1.6, 0.5, 1); }
        @keyframes tk-levelup {
          0% { transform: scale(1); }
          35% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        /* the progression slashes: thin, slanted, evenly spaced */
        .tk-slashes {
          display: flex;
          gap: 2px;
          width: 100%;
          height: 9px;
        }
        .tk-slash {
          position: relative;
          flex: 1;
          overflow: hidden;
          border-radius: 1px;
          transform: skewX(-22deg);
          background: rgba(0,0,0,0.12);
        }
        :global(html[data-theme='night']) .tk-slash { background: rgba(255,255,255,0.16); }
        .tk-slash-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          background: linear-gradient(180deg, #7dffb0, var(--hover-green, #0bf05f));
          transition: background 0.45s ease;
        }
        .tk-slash--full { animation: tk-slash-pop 0.35s ease-out; }
        .tk-slash--full .tk-slash-fill { box-shadow: 0 0 4px rgba(11,240,95,0.6); }
        @keyframes tk-slash-pop {
          0% { transform: skewX(-22deg) scaleY(1); }
          45% { transform: skewX(-22deg) scaleY(1.45); }
          100% { transform: skewX(-22deg) scaleY(1); }
        }
        .tk-pill--done .tk-slash-fill {
          background: linear-gradient(180deg, #8fd0ff, #3d8bff);
          box-shadow: 0 0 4px rgba(61,139,255,0.7);
        }
        /* unlocked: a little star rides the top corner */
        .tk-star {
          position: absolute;
          right: -5px;
          top: -7px;
          font-size: 11px;
          line-height: 1;
          color: #3d8bff;
          text-shadow: 0 0 6px rgba(61,139,255,0.7);
          animation: tk-star 0.5s cubic-bezier(0.3, 1.6, 0.5, 1) both;
          pointer-events: none;
        }
        @keyframes tk-star {
          from { opacity: 0; transform: scale(0.2) rotate(-90deg); }
          to { opacity: 1; transform: none; }
        }
        /* what was just earned drops out from under the pill */
        .tk-gain {
          position: absolute; left: 50%; top: 100%;
          font-size: 10px; font-weight: 800; white-space: nowrap;
          font-variant-numeric: tabular-nums;
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
          .tk-pill--done, .tk-gain, .tk-slash--full, .tk-star { animation: none; }
        }
      `}</style>
    </button>
  )
}
