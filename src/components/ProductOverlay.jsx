// src/components/ProductOverlay.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../contexts/CartContext';

/**
 * Accepts either `product` or `item` to be robust with callers.
 * Props:
 * - product | item: object with { images?, image?, price?, name? }
 * - onClose: () => void
 */
export default function ProductOverlay({ product, item, onClose }) {
  const p = product ?? item;
  const { add } = useCart();

  const [open, setOpen] = useState(false);
  const overlayRef = useRef(null);
  const closeBtnRef = useRef(null);

  // No product? No overlay.
  if (!p) return null;

  // Derive fields safely
  const { img, price, title } = useMemo(() => {
    const img =
      p.images?.[0]?.file?.url ||
      p.images?.[0]?.url ||
      p.image ||
      '/placeholder.png';

    const rawPrice = p.price?.toFixed?.(0) ?? p.price?.value ?? p.price ?? '';
    const price = rawPrice === '' ? '' : String(rawPrice);
    const title = p.name || p.title || 'Product';

    return { img, price, title };
  }, [p]);

  // ESC to close + lock body scroll + initial focus
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // focus the close button for quick escape
    closeBtnRef.current?.focus?.();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Click backdrop to close
  const onBackdrop = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  const choose = () => {
    add(1);
  };

  // Simple shared styles for small chips/buttons (keeps it self-contained)
  const chip = {
    borderRadius: 12,
    padding: '6px 10px',
    fontWeight: 800,
    fontSize: 12,
    lineHeight: 1,
    border: '1px solid rgba(0,0,0,.12)',
    background: 'rgba(0,0,0,.04)',
    color: 'var(--text)',
    cursor: 'pointer',
  };
  const commit = {
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 900,
    fontSize: 14,
    lineHeight: 1,
    border: '1px solid rgba(0,0,0,.14)',
    background: 'rgba(0,0,0,.06)',
    color: 'var(--text)',
    cursor: 'pointer',
  };

  return (
    <div
      ref={overlayRef}
      className="product-hero-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={onBackdrop}
    >
      <button
        ref={closeBtnRef}
        className="product-hero-close"
        onClick={onClose}
        aria-label="Close"
      >
        &lt;
      </button>

      <div className="product-hero" onMouseDown={(e) => e.stopPropagation()}>
        <img className="product-hero-img" src={img} alt={title} />

        <div className="product-hero-title">{title}</div>
        {price !== '' && <div className="product-hero-price">${price}</div>}

        {!open ? (
          <button
            aria-label="Open options"
            onClick={() => setOpen(true)}
            style={{
              ...commit,
              marginTop: 10,
              background: 'rgba(25,145,255,.10)',
              borderColor: 'rgba(25,145,255,.45)',
            }}
          >
            +
          </button>
        ) : (
          <>
            <div
              className="options-header"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                marginTop: 6,
                marginBottom: 10,
              }}
            >
              <button
                className="icon-chip"
                onClick={() => setShowLabels((v) => !v)}
                aria-label="What do 1/2/3 mean?"
                title="Toggle 1/2/3 ↔ S/M/L"
                style={chip}
              >
                ?
              </button>
              <div className="options-title" style={{ fontWeight: 900, letterSpacing: '.06em' }}>
                SELECT SIZE
              </div>
              <button
                className="icon-chip"
                onClick={onClose}
                aria-label="Back"
                style={chip}
              >
                &lt;
              </button>
            </div>

            <div className="row-nowrap" style={{ gap: 10 }}>
              {['1', '2', '3'].map((num, i) => {
                const label = showLabels ? ['S', 'M', 'L'][i] : num;
                return (
                  <button
                    key={num}
                    className="commit-btn"
                    onClick={choose}
                    aria-label={`Choose size ${label}`}
                    style={commit}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 10 }}>
              <button className="commit-btn" onClick={() => setOpen(false)} style={commit}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// local state for labels toggle (kept here to mirror your original)
function useLabelsState() {
  const [showLabels, setShowLabels] = useState(false);
  return { showLabels, setShowLabels };
}
