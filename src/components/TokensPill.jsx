// src/components/TokensPill.jsx
// @ts-check
'use client'

import { useRef } from 'react'
import { useTokenCount } from '@/components/TokensMeter'
import { useDragSnap, pinball } from '@/lib/dragSnap'

const SLASHES = 10 // one per 10% of the way to free shipping

/**
 * The tokens meter in miniature, for a signed-in customer: a clean little
 * cartoon pill (ink outline, hard shadow) under the heart with a row of
 * chunky progression bars, one per 10% of the
 * way to free shipping. They light up one by one as the cart's tokens roll
 * in (the one in progress fills partway, and each pops as it completes), a
 * "+N" drops out when it grows, and once free shipping is unlocked they all
 * turn gold with a star. Like everything else on the shop page it can be
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
            <span key={i} className={`tk-slash ${f >= 1 ? 'tk-slash--full' : ''} ${f <= 0 ? 'tk-slash--empty' : ''}`}>
              <span className="tk-slash-fill" style={{ width: `${(f * 100).toFixed(1)}%` }} />
            </span>
          )
        })}
      </span>
      {done && <span className="tk-star" aria-hidden="true">★</span>}
      {gain && <span key={gain.key} className="tk-gain" aria-hidden="true">+{gain.n.toLocaleString('en-US')}</span>}
      <style jsx>{`
        /* cartoon look: chunky ink outline, hard offset shadow, rounded bars */
        .tk-pill {
          --tk-ink: #111;
          --tk-paper: #fff;
          position: fixed;
          /* centred under the heart (44px, at the right of the top row) */
          top: calc(var(--safe-top, 0px) + var(--header-ctrl, 64px) - 4px);
          right: calc(max(var(--header-pad-x, 16px), env(safe-area-inset-right)) - 8px);
          z-index: 9991;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 22px;
          padding: 0 6px;
          box-sizing: border-box;
          border: 2px solid var(--tk-ink);
          border-radius: 9999px;
          overflow: visible;
          background: var(--tk-paper);
          box-shadow: 2px 2px 0 var(--tk-ink);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: opacity 0.25s ease, transform 0.12s ease, box-shadow 0.12s ease;
          animation: tk-boing 0.6s cubic-bezier(0.3, 1.8, 0.5, 1);
        }
        :global(html[data-theme='night']) .tk-pill {
          --tk-ink: #fff;
          --tk-paper: #161616;
        }
        .tk-pill:active { transform: translate(1px, 1px) scale(0.96, 0.9); box-shadow: 1px 1px 0 var(--tk-ink); }
        @keyframes tk-boing {
          0% { transform: scale(0.4, 0.4); }
          45% { transform: scale(1.15, 0.85); }
          70% { transform: scale(0.94, 1.08); }
          100% { transform: scale(1); }
        }
        /* hidden drops the animation, so it boings again each time it shows */
        .tk-pill--hidden { opacity: 0; pointer-events: none; animation: none; }
        .tk-pill--done { animation: tk-levelup 0.6s cubic-bezier(0.3, 1.8, 0.5, 1); }
        @keyframes tk-levelup {
          0% { transform: scale(1) rotate(0); }
          30% { transform: scale(1.25, 0.8) rotate(-4deg); }
          60% { transform: scale(0.92, 1.12) rotate(3deg); }
          100% { transform: scale(1) rotate(0); }
        }
        /* the progression bars: chunky, rounded, a little slanted */
        .tk-slashes {
          display: flex;
          gap: 2px;
          width: 100%;
          height: 10px;
        }
        .tk-slash {
          position: relative;
          flex: 1;
          overflow: hidden;
          border-radius: 2px;
          transform: skewX(-14deg);
          background: transparent;
          box-shadow: inset 0 0 0 1.5px var(--tk-ink);
        }
        /* bars not reached yet are faint outlines */
        .tk-slash--empty { opacity: 0.28; }
        .tk-slash-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          background: var(--bag-accent, var(--hover-green, #0bf05f));
          transition: background 0.45s ease;
        }
        .tk-slash--full { animation: tk-slash-pop 0.4s cubic-bezier(0.3, 1.8, 0.5, 1); }
        @keyframes tk-slash-pop {
          0% { transform: skewX(-14deg) scale(1, 1); }
          45% { transform: skewX(-14deg) scale(1.3, 1.6); }
          100% { transform: skewX(-14deg) scale(1, 1); }
        }
        .tk-pill--done .tk-slash-fill { background: #f5b301; }
        /* unlocked: a fat outlined star pops onto the top corner */
        .tk-star {
          position: absolute;
          right: -8px;
          top: -10px;
          font-size: 15px;
          line-height: 1;
          color: #ffd23f;
          -webkit-text-stroke: 1.5px var(--tk-ink);
          paint-order: stroke fill;
          animation: tk-star 0.55s cubic-bezier(0.3, 1.8, 0.5, 1) both, tk-star-wobble 2.4s ease-in-out 0.55s infinite;
          pointer-events: none;
        }
        @keyframes tk-star {
          from { opacity: 0; transform: scale(0.2) rotate(-120deg); }
          to { opacity: 1; transform: none; }
        }
        @keyframes tk-star-wobble {
          0%, 100% { transform: rotate(0); }
          50% { transform: rotate(14deg) scale(1.08); }
        }
        /* what was just earned drops out from under the pill */
        .tk-gain {
          position: absolute; left: 50%; top: 100%;
          font-size: 11px; font-weight: 900; white-space: nowrap;
          font-variant-numeric: tabular-nums;
          color: var(--bag-accent, var(--hover-green, #0bf05f));
          -webkit-text-stroke: 1px var(--tk-ink);
          paint-order: stroke fill;
          pointer-events: none;
          animation: tk-gain 1.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
                @keyframes tk-gain {
          0% { opacity: 0; transform: translate(-50%, -4px) scale(0.8); }
          18% { opacity: 1; transform: translate(-50%, 2px) scale(1.15); }
          70% { opacity: 1; transform: translate(-50%, 6px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, 12px) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tk-pill, .tk-pill--done, .tk-gain, .tk-slash--full, .tk-star { animation: none; }
        }
      `}</style>
    </button>
  )
}
