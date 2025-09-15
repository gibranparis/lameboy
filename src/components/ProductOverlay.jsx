'use client';

import { useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';

export default function ProductOverlay({ product, onClose }) {
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = prev; };
  }, [onClose]);

  if (!product) return null;

  const img = product.images?.[0]?.file?.url || product.images?.[0]?.url || product.image || '/placeholder.png';
  const price = product.price?.toFixed?.(0) ?? product.price?.value ?? product.price ?? '';

  const choose = () => { add(1); };

  return (
    <div className="product-hero-overlay" role="dialog" aria-modal="true">
      <button className="product-hero-close" onClick={onClose} aria-label="Close">&lt;</button>

      <div className="product-hero">
        <img className="product-hero-img" src={img} alt={product.name || 'Product'} />

        <div className="product-hero-title">{product.name || '—'}</div>
        {price !== '' && <div className="product-hero-price">${price}</div>}

        {!open && (
          <button className="hero-plus" onClick={() => setOpen(true)} aria-label="Open options">+</button>
        )}

        {open && (
          <>
            <div className="options-header">
              <button
                className="icon-chip"
                onClick={() => setShowLabels((v) => !v)}
                aria-label="What do 1/2/3 mean?"
                title="Toggle 1/2/3 ↔ S/M/L"
              >
                ?
              </button>
              <div className="options-title">SELECT SIZE</div>
              <button className="icon-chip" onClick={onClose} aria-label="Back">&lt;</button>
            </div>

            <div className="row-nowrap" style={{ gap: 10 }}>
              {['1', '2', '3'].map((num, i) => {
                const label = showLabels ? ['S', 'M', 'L'][i] : num;
                return (
                  <button key={num} className="commit-btn" onClick={choose} aria-label={`Choose size ${label}`}>
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 8 }}>
              <button className="commit-btn" onClick={() => setOpen(false)}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
