// src/components/LoopFab.jsx
'use client';
import { useEffect, useRef, useState } from 'react';

export default function LoopFab({
  onCycle,
  tooltip = 'Cycle view',
  disabled = false,
  size = 44,
  className = '',
}) {
  const [spinning, setSpinning] = useState(false);
  const pressRef = useRef(false);

  const handleClick = () => {
    if (disabled) return;
    setSpinning(true);
    onCycle?.();
  };

  // Stop the little spin after the CSS animation finishes
  useEffect(() => {
    if (!spinning) return;
    const t = setTimeout(() => setSpinning(false), 360);
    return () => clearTimeout(t);
  }, [spinning]);

  return (
    <>
      <button
        type="button"
        aria-label={tooltip}
        title={tooltip}
        className={[
          'lb-loop-fab',
          spinning ? 'is-spinning' : '',
          disabled ? 'is-disabled' : '',
          className,
        ].join(' ')}
        onMouseDown={() => (pressRef.current = true)}
        onMouseUp={() => (pressRef.current = false)}
        onMouseLeave={() => (pressRef.current = false)}
        onClick={handleClick}
        style={{ width: size, height: size }}
      >
        <span className="lb-plus" />
      </button>

      <style jsx>{`
        .lb-loop-fab {
          position: fixed;
          left: 22px;
          top: 22px;
          display: grid;
          place-items: center;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.85);
          box-shadow:
            0 2px 10px rgba(0, 0, 0, 0.18),
            0 0 24px rgba(255, 255, 255, 0.35);
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 160ms ease, background 120ms ease;
          z-index: 40;
          backdrop-filter: blur(6px);
        }
        .lb-loop-fab:hover {
          transform: translateY(-1px);
          box-shadow:
            0 6px 22px rgba(0, 0, 0, 0.2),
            0 0 34px rgba(255, 255, 255, 0.5);
        }
        .lb-loop-fab:active {
          transform: translateY(0);
          background: rgba(255, 255, 255, 0.92);
        }
        .lb-loop-fab.is-disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .lb-plus {
          position: relative;
          width: 45%;
          height: 45%;
        }
        .lb-plus::before,
        .lb-plus::after {
          content: '';
          position: absolute;
          inset: 0;
          margin: auto;
          background: #000;
          border-radius: 2px;
          filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.4));
        }
        .lb-plus::before {
          width: 100%;
          height: 18%;
        }
        .lb-plus::after {
          width: 18%;
          height: 100%;
        }

        .lb-loop-fab.is-spinning {
          animation: lb-spin 360ms ease;
        }
        @keyframes lb-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(180deg); }
        }
      `}</style>
    </>
  );
}
