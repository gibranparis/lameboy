// @ts-check
// src/components/ShopGrid.jsx
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ProductOverlay from '@/components/ProductOverlay';

/** Pill (shared look) */
function Pill({ children, onClick, active=false, ready=false, selected=false, className='', ...rest }) {
  const cls = [
    'pill',
    className,
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

// Fallback minimal catalog if none is supplied (non-blocking)
const FALLBACK = [
  { id: 'p1', title: 'LAME Tee – White', price: 3200, image: '/products/tee-white.png', images: ['/products/tee-white.png'], sizes: ['S','M','L','XL'] },
  { id: 'p2', title: 'LAME Hoodie – Pink', price: 8800, image: '/products/hoodie-pink.png', images: ['/products/hoodie-pink.png'], sizes: ['M','L','XL'] },
  { id: 'p3', title: 'LAME Cap – Brown',  price: 4200, image: '/products/cap-brown.png',  images: ['/products/cap-brown.png'],  sizes: ['OS'] },
];

/** Grid */
export default function ShopGrid({ products }) {
  const catalog = Array.isArray(products) && products.length ? products : FALLBACK;

  const [overlayId, setOverlayId] = useState/** @type {string|null} */(null);

  // === Grid density (orb) — smooth 5→1→5 bounce, one step per click ===
  const [cols, setCols] = useState(5);
  const [down, setDown] = useState(true); // are we stepping downward?

  const stepCols = useCallback(() => {
    setCols((prev) => {
      let next = prev;
      if (down) next = Math.max(1, prev - 1);
      else next = Math.min(5, prev + 1);

      let nextDown = down;
      if (next === 1) nextDown = false;
      if (next === 5) nextDown = true;
      setDown(nextDown);

      document.documentElement.style.setProperty('--grid-cols', String(next));
      return next;
    });
  }, [down]);

  // hook up to orb
  useEffect(() => {
    const onZoom = (e) => {
      // If overlay open, ignore density (overlay consumes orb as back)
      if (overlayId != null) return;
      stepCols();
    };
    window.addEventListener('lb:zoom', onZoom);
    return () => window.removeEventListener('lb:zoom', onZoom);
  }, [overlayId, stepCols]);

  // open/close helpers
  const open = (id) => setOverlayId(id);
  const close = () => setOverlayId(null);

  // current product & index
  const index = useMemo(() => catalog.findIndex(p => p.id === overlayId), [catalog, overlayId]);
  const overlayProduct = index >= 0 ? catalog[index] : null;

  // next/prev product from overlay (wrap disabled; clamp instead)
  const prevProduct = useCallback(() => {
    if (index <= 0) return; // clamp at first
    setOverlayId(catalog[index - 1].id);
  }, [index, catalog]);

  const nextProduct = useCallback(() => {
    if (index < 0) return;
    if (index >= catalog.length - 1) return; // clamp at last
    setOverlayId(catalog[index + 1].id);
  }, [index, catalog]);

  // When overlay is open, dim grid interactions via the html flag (CSS handles)
  useEffect(() => {
    const r = document.documentElement;
    if (overlayId) r.setAttribute('data-overlay-open', '1');
    else r.removeAttribute('data-overlay-open');
    return () => r.removeAttribute('data-overlay-open');
  }, [overlayId]);

  // Add-to-cart passthrough (optional external hook)
  const onAddToCart = useCallback((product, { size, qty }) => {
    // external hook goes here if needed; events already dispatched in overlay
    // console.log('added', product.id, size, qty);
  }, []);

  return (
    <div className="shop-wrap" style={{ padding:'28px 28px 60px' }}>
      <div className="shop-grid" style={{ '--grid-cols': cols }}>
        {catalog.map((p) => (
          <a
            key={p.id}
            className="product-tile lb-tile"
            role="button"
            tabIndex={0}
            onClick={(e)=>{ e.preventDefault(); open(p.id); }}
            onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); open(p.id); }}}
          >
            <div className="product-box">
              <Image
                src={p.image || p.images?.[0] || '/placeholder.png'}
                alt={p.title}
                width={800}
                height={800}
                className="product-img"
                priority={p===catalog[0]}
              />
            </div>
            <div className="product-meta">{p.title}</div>
          </a>
        ))}
      </div>

      {/* Overlay */}
      {overlayProduct && (
        <ProductOverlay
          product={overlayProduct}
          onClose={close}
          onAddToCart={onAddToCart}
          onPrevProduct={prevProduct}
          onNextProduct={nextProduct}
        />
      )}
    </div>
  );
}
