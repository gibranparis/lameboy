'use client';

import { useEffect, useMemo, useState } from 'react';

const SIZES = ['XS','S','M','L','XL'];

export default function ProductOverlay({ product, onClose }) {
  const priceText = useMemo(() => {
    const cents = product?.price ?? 0;
    return `$${(cents/100).toFixed(2)}`;
  }, [product]);

  const [mode, setMode] = useState('plus'); // 'plus' | 'sizes'
  const [size, setSize] = useState(null);
  const [adding, setAdding] = useState(false);

  // Close overlay when orb is pressed (handled in ShopGrid) – nothing here.
  // Hide the grid behind overlay
  useEffect(() => {
    const page = document.querySelector('.shop-grid');
    const prev = page?.style.visibility;
    if (page) page.style.visibility = 'hidden';
    return () => { if (page) page.style.visibility = prev || ''; };
  }, []);

  // Keyboard escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onPlusClick = () => {
    // show sizes instead of plus
    setMode('sizes');
  };

  const onPickSize = (s) => {
    setSize(s);
    // flash chosen then add to cart
    setAdding(true);
    setTimeout(() => {
      // bump cart
      try { window.dispatchEvent(new CustomEvent('cart:add', { detail: { id: product.id, size: s } })); } catch {}
      setAdding(false);
      setMode('plus');
      setSize(null);
    }, 280);
  };

  return (
    <div className="product-hero-overlay" role="dialog" aria-modal="true" onClick={(e) => { if(e.target === e.currentTarget) onClose?.(); }}>
      <div className="product-hero">
        {/* keep header; NO extra back icon, orb itself closes via ShopGrid */}
        <img className="product-hero-img" src={product.img} alt="" />
        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">{priceText}</div>

        {mode === 'plus' ? (
          <div style={{ display:'grid', placeItems:'center', marginTop:10 }}>
            <button
              type="button"
              aria-label="Choose size"
              onClick={onPlusClick}
              className="pill"
              title="Choose size"
            >
              +
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', placeItems:'center', gap:10, marginTop:12 }}>
            <div className="row-nowrap" style={{ justifyContent:'center' }}>
              {SIZES.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`pill ${adding && size===s ? 'pill-green' : ''}`}
                  onClick={() => onPickSize(s)}
                  aria-pressed={size===s}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
