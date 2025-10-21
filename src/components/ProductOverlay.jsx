'use client';

import { useEffect, useMemo, useState } from 'react';

const SIZES = ['XS','S','M','L','XL'];

export default function ProductOverlay({ product, onClose }) {
  const priceText = useMemo(
    () => `$${((product?.price ?? 0) / 100).toFixed(2)}`,
    [product]
  );

  // UI flow: 'plus' → 'sizes' → (select) → add + badge → back to 'plus'
  const [mode, setMode] = useState('plus');            // 'plus' | 'sizes'
  const [activeSize, setActiveSize] = useState(null);  // 'M', etc.
  const [adding, setAdding] = useState(false);

  // Hide grid while overlay is open
  useEffect(() => {
    const grid = document.querySelector('.shop-grid');
    const prev = grid?.style.visibility;
    if (grid) grid.style.visibility = 'hidden';
    return () => { if (grid) grid.style.visibility = prev || ''; };
  }, []);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Orb-as-back-button (header orb should zoom on grid; here it should close)
  useEffect(() => {
    const onHeaderOrb = () => onClose?.();
    window.addEventListener('lb:overlay:back', onHeaderOrb);
    return () => window.removeEventListener('lb:overlay:back', onHeaderOrb);
  }, [onClose]);

  // Inform header orb to behave as back while overlay is shown
  useEffect(() => {
    const enable = () => {
      try { window.dispatchEvent(new CustomEvent('lb:overlay:mode', { detail:{ active:true } })); } catch {}
    };
    const disable = () => {
      try { window.dispatchEvent(new CustomEvent('lb:overlay:mode', { detail:{ active:false } })); } catch {}
    };
    enable();
    return disable;
  }, []);

  const onPlusClick = () => setMode('sizes');

  const onPickSize = (s) => {
    setActiveSize(s);
    setAdding(true);

    // fake add → bump cart badge → reset UI
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('cart:add', {
          detail: { id: product.id, size: s, qty: 1 }
        }));
      } catch {}
      setAdding(false);
      setMode('plus');
      setActiveSize(null);
    }, 260);
  };

  // “pill” fallback styles (bullet-proof even if CSS was purged)
  const pillBase = {
    display:'inline-grid', placeItems:'center',
    minWidth:34, height:28, padding:'0 10px',
    borderRadius:10, border:'1px solid rgba(0,0,0,.12)',
    background:'#fff', color:'#111',
    fontWeight:800, letterSpacing:'.02em',
    boxShadow:'0 1px 0 rgba(0,0,0,.06)'
  };
  const pillGreen = { background:'#0bf05f', color:'#000', borderColor:'#06c94f' };
  const pillGrey  = { background:'#f4f4f4', color:'#111' };

  return (
    <div
      className="product-hero-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="product-hero">
        <img className="product-hero-img" src={product?.img} alt="" />

        <div className="product-hero-title">{product?.title}</div>
        <div className="product-hero-price">{priceText}</div>

        {mode === 'plus' ? (
          <div style={{ display:'grid', placeItems:'center', marginTop:12 }}>
            <button
              type="button"
              aria-label="Choose size"
              className="pill"
              style={{ ...pillBase, ...pillGrey }}
              onClick={onPlusClick}
              title="Choose size"
            >
              +
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', placeItems:'center', gap:10, marginTop:12 }}>
            <div className="row-nowrap" style={{ justifyContent:'center' }}>
              {SIZES.map((s) => {
                const isActive = activeSize === s && adding;
                return (
                  <button
                    key={s}
                    type="button"
                    className="pill"
                    style={{ ...pillBase, ...(isActive ? pillGreen : pillGrey) }}
                    onClick={() => onPickSize(s)}
                    aria-pressed={activeSize === s}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
