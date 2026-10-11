// src/components/TokensMeter.jsx
// @ts-check
'use client'

import { useEffect, useRef, useState } from 'react'

const COUNT_MS = 1100 // how long the count takes to roll to a new total
const TICKS = [10, 20, 30, 40, 50, 60, 70, 80, 90] // milestones, % of the goal

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * The rolling token count shared by the meter and the pill: rolls from where
 * it was to `tokens` like a score, with a "+N" for what was just earned. It
 * counts up from `from` (default empty) each time it opens.
 * @param {{ tokens: number, open?: boolean, from?: number, showGain?: boolean }} opts
 *   showGain: show the "+N" even for the first count after opening (the
 *   pop-up over the bag, where that first count is the add itself)
 */
export function useTokenCount({ tokens, open = true, from = 0, showGain = false }) {
  const [val, setVal] = useState(from)
  const valRef = useRef(from)
  // The total it last counted toward since it opened (null: not yet)
  const target = useRef(/** @type {number | null} */ (null))
  const [gain, setGain] = useState(/** @type {null | { n: number, key: number }} */ (null))

  useEffect(() => {
    if (!open) {
      valRef.current = from
      target.current = null
      setVal(from)
      return
    }
    const prev = target.current
    target.current = tokens
    // "+N" for tokens earned while it's up (or, with showGain, from `from`)
    if (prev === null ? showGain && tokens > from : tokens > prev) {
      setGain({ n: Math.round(tokens - (prev ?? from)), key: Date.now() })
    }
    const start = valRef.current
    if (tokens === start) return
    if (reducedMotion()) {
      valRef.current = tokens
      setVal(tokens)
      return
    }
    let raf = 0
    const t0 = performance.now() + (prev === null ? 120 : 0)
    const tick = (/** @type {number} */ now) => {
      const p = Math.min(1, Math.max(0, (now - t0) / COUNT_MS))
      const v = start + (tokens - start) * (1 - Math.pow(1 - p, 4))
      valRef.current = v
      setVal(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tokens])

  return { val, gain }
}

/**
 * The tokens meter, played like a game: the cart's tokens toward the free
 * shipping goal (see lib/freeShipping). The count rolls up like a score with
 * a "+N" for what was just earned, each 10% milestone lights up as the fill
 * passes it, and reaching the goal levels it up: the bar turns blue and
 * glows. It counts up from `from` (default empty) each time it opens, and
 * rolls to the new total whenever the cart changes.
 * @param {{ tokens: number, goal: number, open?: boolean, from?: number, showGain?: boolean, className?: string }} props
 */
export default function TokensMeter({ tokens, goal, open = true, from = 0, showGain = false, className = '' }) {
  const { val, gain } = useTokenCount({ tokens, open, from, showGain })

  const shown = Math.round(val)
  const percent = goal > 0 ? Math.min(100, (val / goal) * 100) : 0
  // Unlocked once the count itself gets there, so it levels up on arrival
  const done = tokens >= goal && shown >= goal
  // Any progress at all shows as a visible sliver
  const width = percent > 0 ? Math.max(percent, 3) : 0
  const left = Math.max(0, goal - shown)

  return (
    <div
      className={`nl-evo ${done ? 'nl-evo--done' : ''} ${className}`}
      role="progressbar"
      aria-label="tokens"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.min(tokens, goal)}
      aria-valuetext={`${tokens} of ${goal} tokens`}
    >
      <div className="nl-evo-head">
        <span>tokens</span>
        <span className="nl-evo-score">
          {gain && (
            <span key={gain.key} className="nl-evo-gain" aria-hidden="true">+{gain.n.toLocaleString('en-US')}</span>
          )}
          <b>{shown.toLocaleString('en-US')}</b> / {goal.toLocaleString('en-US')}
        </span>
      </div>
      <div className="nl-evo-track">
        <div className="nl-evo-fill" style={{ width: `${width}%` }} />
        {TICKS.map((t) => (
          <span key={t} className={`nl-evo-tick ${percent >= t ? 'nl-evo-tick--lit' : ''}`} style={{ left: `${t}%` }} aria-hidden="true" />
        ))}
      </div>
      <div className="nl-evo-caption">
        {done ? 'free shipping unlocked ★' : `${left.toLocaleString('en-US')} token${left === 1 ? '' : 's'} to free shipping`}
      </div>
      <style jsx>{`
        .nl-evo { margin: 2px 0 14px; }
        .nl-evo-head {
          display: flex; justify-content: space-between; align-items: baseline;
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(255,255,255,0.55); margin-bottom: 6px;
        }
        :global(html[data-theme='day']) .nl-evo-head { color: rgba(0,0,0,0.5); }
        .nl-evo-score { position: relative; font-variant-numeric: tabular-nums; }
        .nl-evo-score b { font-weight: 800; color: rgba(255,255,255,0.9); }
        :global(html[data-theme='day']) .nl-evo-score b { color: rgba(0,0,0,0.82); }
        /* what was just earned floats up off the score */
        .nl-evo-gain {
          position: absolute; right: 0; bottom: 100%;
          font-size: 11px; font-weight: 800; letter-spacing: 0.02em; white-space: nowrap;
          color: var(--hover-green, #0bf05f);
          text-shadow: 0 0 8px rgba(11,240,95,0.55);
          pointer-events: none;
          animation: nl-evo-gain 1.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        :global(html[data-theme='day']) .nl-evo-gain { color: #08a443; text-shadow: none; }
        @keyframes nl-evo-gain {
          0% { opacity: 0; transform: translateY(6px) scale(0.8); }
          18% { opacity: 1; transform: translateY(0) scale(1.15); }
          70% { opacity: 1; transform: translateY(-4px) scale(1); }
          100% { opacity: 0; transform: translateY(-10px) scale(1); }
        }
        .nl-evo-track {
          position: relative; height: 12px; border-radius: 9999px; overflow: hidden;
          background: rgba(255,255,255,0.1);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
        }
        :global(html[data-theme='day']) .nl-evo-track {
          background: rgba(0,0,0,0.07);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
        }
        /* milestone marks every 10%: dim ahead, lit (with a pop) once passed */
        .nl-evo-tick {
          position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px;
          background: rgba(255,255,255,0.22);
          pointer-events: none;
        }
        :global(html[data-theme='day']) .nl-evo-tick { background: rgba(0,0,0,0.16); }
        .nl-evo-tick--lit,
        :global(html[data-theme='day']) .nl-evo-tick--lit {
          background: rgba(255,255,255,0.85);
          box-shadow: 0 0 6px rgba(255,255,255,0.9);
          animation: nl-evo-tick 0.4s ease-out;
        }
        @keyframes nl-evo-tick {
          0% { transform: scaleY(0.2); opacity: 0.4; }
          50% { transform: scaleY(1.6); opacity: 1; }
          100% { transform: scaleY(1); }
        }
        .nl-evo-fill {
          position: relative; height: 100%; border-radius: inherit; overflow: hidden;
          background: linear-gradient(90deg, #08c94f, var(--hover-green, #0bf05f) 60%, #7dffb0);
          box-shadow: 0 0 10px rgba(11,240,95,0.45);
          transition: box-shadow 0.5s ease;
        }
        /* free shipping unlocked: blue fades in over the green as the fill lands */
        .nl-evo-fill::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, #1f5fe0, #3d8bff 60%, #8fd0ff);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .nl-evo--done .nl-evo-fill { box-shadow: 0 0 10px rgba(61,139,255,0.5); }
        .nl-evo--done .nl-evo-fill::before { opacity: 1; transition-duration: 0.45s; }
        /* a soft light gliding along the filled part */
        .nl-evo-fill::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%);
          transform: translateX(-120%);
          animation: nl-evo-sheen 2.8s ease-in-out 1.2s infinite;
        }
        @keyframes nl-evo-sheen {
          0% { transform: translateX(-120%); }
          55%, 100% { transform: translateX(220%); }
        }
        .nl-evo-caption {
          margin-top: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
          font-variant-numeric: tabular-nums;
          color: rgba(255,255,255,0.55);
        }
        :global(html[data-theme='day']) .nl-evo-caption { color: rgba(0,0,0,0.5); }
        .nl-evo--done .nl-evo-head > span:first-child,
        .nl-evo--done .nl-evo-caption { color: #5aa8ff; transition: color 0.45s ease; }
        :global(html[data-theme='day']) .nl-evo--done .nl-evo-head > span:first-child,
        :global(html[data-theme='day']) .nl-evo--done .nl-evo-caption { color: #1f5fe0; }
        /* level up: a bounce as it unlocks, then a steady blue glow */
        .nl-evo--done .nl-evo-track {
          animation: nl-evo-levelup 0.55s cubic-bezier(0.3, 1.6, 0.5, 1), nl-evo-glow 2.2s ease-in-out 0.55s infinite;
        }
        @keyframes nl-evo-levelup {
          0% { transform: scale(1); }
          35% { transform: scale(1.06, 1.5); }
          100% { transform: scale(1); }
        }
        @keyframes nl-evo-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(61,139,255,0); }
          50% { box-shadow: 0 0 14px 2px rgba(61,139,255,0.55); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nl-evo-fill, .nl-evo-fill::before, .nl-evo--done .nl-evo-caption { transition: none; }
          .nl-evo-fill::after, .nl-evo--done .nl-evo-track, .nl-evo-tick--lit, .nl-evo-gain { animation: none; }
        }
      `}</style>
    </div>
  )
}
