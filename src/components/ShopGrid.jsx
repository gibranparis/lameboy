// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

/** Tiny inline placeholder to avoid 404s if no /public/placeholder.png */
const PLACEHOLDER_SRC = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
     <rect width="100%" height="100%" fill="#0e0e12"/>
     <text x="50%" y="50%" fill="#6ee7b7" font-size="36" font-family="Helvetica,Arial,sans-serif" dominant-baseline="middle" text-anchor="middle">LAMEBOY</text>
   </svg>`
);

/** Pill (shared look) */
function Pill({ children, onClick, active=false, ready=false, selected=false, className='', ...rest }) {
  const cls = [
    'pill', className,
    active ? 'plus-pill is-active' : '',
    ready ? 'plus-pill is-ready' : '',
    selected ? 'size-pill is-selected flash-green' : '',
  ].join(' ').trim();
  return (
    <button type="button" className={cls} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

/** Overlay for a single product */
function ProductOverlay({ product, onClose }) {
  const [plusOpen, setPlusOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const onZoom = () => onClose(); // orb = back
    window.addEventListener('lb:zoom', onZoom);
    return () => window.removeEventListener('lb:zoom', onZoom);
  }, [onClose]);

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-overlay-open', '1');
    return () => r.removeAttribute('data-overlay-open');
  }, []);

  const handlePlus = () => { setPlusOpen(v => !v); setJustAdded(false); };

  const handlePickSize = (size) => {
    try { window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail: { id: product.id, size, count: 1 } })); } catch {}
    setJustAdded(true);
    setPlusOpen(false);
    setTimeout(() => setJustAdded(false), 260);
  };

  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];

  return (
    <div className="product-hero-overlay" role="dialog" aria-modal="true">
      <div className="product-hero">
        <div style={{ width:'100%', display:'grid', placeItems:'center' }}>
          <Image
            src={product?.image || PLACEHOLDER_SRC}
            alt={product?.title || 'Product'}
            width={1000}
            height={800}
            className="product-hero-img"
            priority
          />
        </div>

        <div className="product-hero-title">{product?.title ?? 'LAMEBOY'}</div>
        <div className="product-hero-price">${(((product?.price ?? 0)/100) || 0).toFixed(2)}</div>

        <div style={{ display:'grid', justifyItems:'center', gap:10, marginTop:4 }}>
          <Pill aria-label="Add" active={plusOpen && !justAdded} ready={justAdded} onClick={handlePlus} className="w-[34px] h-[34px] !p-0">+</Pill>
          {plusOpen && (
            <div className="row-nowrap" style={{ gap:8 }}>
              {['XS','S','M','L','XL']
                .filter(sz => sizes.includes(sz))
                .map(sz => <Pill key={sz} onClick={() => handlePickSize(sz)}>{sz}</Pill>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Fallback placeholders if no products are passed */
function placeholders(n = 16) {
  return Array.from({ length: n }).map((_, i) => ({
    id: `ph-${i}`,
    title: `LAMEBOY ${i + 1}`,
    image: PLACEHOLDER_SRC,
    price: 4000 + i * 100,
    sizes: ['S','M','L','XL'],
  }));
}

/** Grid */
export default function ShopGrid({ products, hideTopRow = false }) {
  // Normalize products to a safe array
  const list = useMemo(() => (Array.isArray(products) ? products : placeholders(24)), [products]);

  const [overlayId, setOverlayId] = useState(null);

  // === Grid density (orb) — smooth 5→1→5 bounce, one step per click ===
  const [cols, setCols] = useState(5);
  const [down, setDown] = useState(true);

  const stepCols = useCallback(() => {
    setCols(prev => {
      const next = down ? Math.max(1, prev - 1) : Math.min(5, prev + 1);
      const nd = (next === 1) ? false : (next === 5) ? true : down;
      setDown(nd);
      try { document.documentElement.style.setProperty('--grid-cols', String(next)); } catch {}
      return next;
    });
  }, [down]);

  useEffect(() => {
    const onZoom = () => { if (overlayId == null) stepCols(); };
    window.addEventListener('lb:zoom', onZoom);
    return () => window.removeEventListener('lb:zoom', onZoom);
  }, [overlayId, stepCols]);

  const open = (id) => setOverlayId(id);
  const close = () => setOverlayId(null);

  const overlayProduct = useMemo(
    () => list.find?.(p => p?.id === overlayId) ?? null,
    [overlayId, list]
  );

  return (
    <div className="shop-wrap" style={{ padding:'28px 28px 60px' }}>
      {hideTopRow ? <div style={{ height: 0 }} aria-hidden="true" /> : null}

      <div
        className="shop-grid"
        style={{
          display:'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: 12,
        }}
      >
        {list.map((p, i) => (
          <a
            key={p?.id ?? i}
            className="product-tile lb-tile"
            role="button"
            tabIndex={0}
            onClick={(e)=>{ e.preventDefault(); open(p?.id ?? i); }}
            onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); open(p?.id ?? i); }}}
          >
            <div className="product-box">
              <Image
                src={p?.image || PLACEHOLDER_SRC}
                alt={p?.title ?? 'Item'}
                width={800}
                height={800}
                className="product-img"
                priority={i === 0}
              />
            </div>
            <div className="product-meta">{p?.title ?? `Item ${i + 1}`}</div>
          </a>
        ))}
      </div>

      {overlayProduct && <ProductOverlay product={overlayProduct} onClose={close} />}
    </div>
  );
}
