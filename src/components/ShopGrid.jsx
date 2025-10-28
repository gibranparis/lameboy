// @ts-check
'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Proper dynamic overlay import (no await-in-JSX errors)
const ProductOverlay = dynamic(() => import('./ProductOverlay'), { ssr: false });

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

/** Grid */
export default function ShopGrid({ products = [] }) {
  // if no data was wired yet, keep a tiny placeholder so layout is valid
  const items = products.length ? products : [{
    id: 'placeholder',
    title: 'LAME Cap — Brown',
    price: 4200,
    image: '/products/lame-cap-brown.png',
    sizes: ['OS'],
  }];

  const [overlayId, setOverlayId] = useState(null);

  // === Grid density (orb) — smooth 5→1→5 bounce, one step per click ===
  const [cols, setCols] = useState(5);
  const [down, setDown] = useState(true); // are we stepping downward?

  const stepCols = useCallback(() => {
    setCols((prev) => {
      let next = prev;
      if (down) next = Math.max(1, prev - 1);
      else next = Math.min(5, prev + 1);

      // bounce at ends
      let nextDown = down;
      if (next === 1) nextDown = false;
      if (next === 5) nextDown = true;
      setDown(nextDown);

      // reflect to CSS so layout updates
      document.documentElement.style.setProperty('--grid-cols', String(next));
      return next;
    });
  }, [down]);

  // hook up to orb
  useEffect(() => {
    const onZoom = () => {
      // If overlay open, ignore density (overlay will consume to close)
      if (overlayId != null) return;
      stepCols();
    };
    window.addEventListener('lb:zoom', onZoom);
    return () => window.removeEventListener('lb:zoom', onZoom);
  }, [overlayId, stepCols]);

  // open/close overlay
  const open  = (id) => setOverlayId(id);
  const close = () => setOverlayId(null);

  const overlayProduct = useMemo(
    () => items.find((p) => p.id === overlayId) || null,
    [overlayId, items]
  );

  return (
    <div className="shop-wrap" style={{ padding:'28px 28px 60px' }}>
      <div className="shop-grid" style={{ '--grid-cols': cols }}>
        {items.map((p, idx) => (
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
                src={p.image}
                alt={p.title}
                width={800}
                height={800}
                className="product-img"
                priority={idx === 0}
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
          onAddToCart={({/* product */}, { size, qty }) => {
            try { window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail: { size, count: qty } })); } catch {}
            try { window.dispatchEvent(new CustomEvent('cart:add',       { detail: { size, qty } })); } catch {}
          }}
        />
      )}
    </div>
  );
}
