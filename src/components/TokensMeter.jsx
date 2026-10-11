// src/components/TokensMeter.jsx
// @ts-check
'use client'

import { useEffect, useState } from 'react'

/**
 * The tokens meter: the cart's progress toward free shipping (see
 * lib/freeShipping). Green while it fills, blue once free shipping is
 * unlocked (it turns as the fill reaches the end). Hash marks every 10% read like a gauge. It fills up from
 * `from` (default empty) each time it opens, and slides to the new level
 * whenever the cart changes; glows once complete.
 * `tally` (e.g. "50 / 80" tokens) shows in place of the percentage.
 * @param {{ percent: number, open?: boolean, from?: number, tally?: string, caption?: string, className?: string }} props
 */
export default function TokensMeter({ percent, open = true, from = 0, tally, caption, className = '' }) {
  const [shown, setShown] = useState(from)
  useEffect(() => {
    if (!open) { setShown(from); return }
    const t = setTimeout(() => setShown(percent), 120)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, percent])
  // Complete once the fill itself gets there, so it turns blue on arrival
  const done = percent >= 100 && shown >= 100
  // Any progress at all shows as a visible sliver
  const width = percent > 0 ? Math.max(shown, shown > 0 ? 3 : 0) : 0
  const label = 'tokens'
  return (
    <div
      className={`nl-evo ${done ? 'nl-evo--done' : ''} ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.floor(percent * 10) / 10}
      aria-valuetext={tally ? `${tally} tokens` : undefined}
    >
      <div className="nl-evo-head">
        <span>{label}</span>
        <span>{tally ?? `${(Math.floor(percent * 10) / 10).toFixed(1)}%`}</span>
      </div>
      <div className="nl-evo-track">
        <div className="nl-evo-fill" style={{ width: `${width}%` }} />
        <div className="nl-evo-hash" aria-hidden="true" />
      </div>
      {caption && <div className="nl-evo-caption">{caption}</div>}
      <style jsx>{`
        .nl-evo { margin: 2px 0 14px; }
        .nl-evo-head {
          display: flex; justify-content: space-between; align-items: baseline;
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(255,255,255,0.55); margin-bottom: 6px;
        }
        :global(html[data-theme='day']) .nl-evo-head { color: rgba(0,0,0,0.5); }
        .nl-evo-track {
          position: relative; height: 12px; border-radius: 9999px; overflow: hidden;
          background: rgba(255,255,255,0.1);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
        }
        :global(html[data-theme='day']) .nl-evo-track {
          background: rgba(0,0,0,0.07);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
        }
        /* hash marks every 10%, over both the fill and the empty track */
        .nl-evo-hash {
          position: absolute; inset: 0; pointer-events: none;
          /* drop the tile's last mark, which would sit on the 100% edge */
          clip-path: inset(0 2px 0 0);
          background: linear-gradient(90deg, transparent calc(100% - 2px), rgba(255,255,255,0.22) 0) 0 0 / 10% 100%;
        }
        :global(html[data-theme='day']) .nl-evo-hash {
          background: linear-gradient(90deg, transparent calc(100% - 2px), rgba(0,0,0,0.16) 0) 0 0 / 10% 100%;
        }
        .nl-evo-fill {
          position: relative; height: 100%; border-radius: inherit; overflow: hidden;
          background: linear-gradient(90deg, #08c94f, var(--hover-green, #0bf05f) 60%, #7dffb0);
          box-shadow: 0 0 10px rgba(11,240,95,0.45);
          transition: width 1.1s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s ease;
        }
        /* free shipping unlocked: blue fades in over the green as the fill lands */
        .nl-evo-fill::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, #1f5fe0, #3d8bff 60%, #8fd0ff);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .nl-evo--done .nl-evo-fill { box-shadow: 0 0 10px rgba(61,139,255,0.5); transition-delay: 0s, 0.9s; }
        .nl-evo--done .nl-evo-fill::before { opacity: 1; transition: opacity 0.5s ease 0.9s; }
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
          color: rgba(255,255,255,0.55);
        }
        :global(html[data-theme='day']) .nl-evo-caption { color: rgba(0,0,0,0.5); }
        .nl-evo--done .nl-evo-head span:first-child,
        .nl-evo--done .nl-evo-caption { color: #5aa8ff; transition: color 0.5s ease 0.9s; }
        :global(html[data-theme='day']) .nl-evo--done .nl-evo-head span:first-child,
        :global(html[data-theme='day']) .nl-evo--done .nl-evo-caption { color: #1f5fe0; }
        .nl-evo--done .nl-evo-track { animation: nl-evo-glow 2.2s ease-in-out 0.9s infinite; }
        @keyframes nl-evo-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(61,139,255,0); }
          50% { box-shadow: 0 0 14px 2px rgba(61,139,255,0.55); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nl-evo-fill, .nl-evo-fill::before, .nl-evo--done .nl-evo-fill::before { transition: none; }
          .nl-evo-fill::after, .nl-evo--done .nl-evo-track { animation: none; }
        }
      `}</style>
    </div>
  )
}
