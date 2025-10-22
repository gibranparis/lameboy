// @ts-check
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

/** Overlay for a single product */
function ProductOverlay({ product, onClose }) {
  const [plusOpen, setPlusOpen] = useState(false);      // "+" grey state → reveal sizes
  const [justAdded, setJustAdded] = useState(false);    // flash state for "+"
  const rootRef = useRef(null);

  // close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // orb acts as "back" while overlay is open
  useEffect(() => {
    const onZoom = () => {
      onClose(); // consume orb to back out
    };
    window.addEventListener('lb:zoom', onZoom);
    return () => window.removeEventListener('lb:zoom', onZoom);
  }, [onClose]);

  // prevent grid clicks / dim background via html flag
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-overlay-open', '1');
    return () => r.removeAttribute('data-overlay-open');
  }, []);

  const handlePlus = () => {
    // Toggle the size menu. When opening, "+" becomes grey (is-active).
    setPlusOpen((v) => !v);
    setJustAdded(false);
  };

  const handlePickSize = (size) => {
    // Add to cart
    window.dispatchEvent(new CustomEvent('lb:add-to-cart', { detail: { id: product.id, size, count: 1 } }));
    // briefly show "+" as green / success
    setJustAdded(true);
    // hide sizes and reset to idle "+"
    setPlusOpen(false);
    // after the flash, drop the green look
    setTimeout(() => setJustAdded(false), 260);
  };

  const sizes = product.sizes?.length ? product.sizes : [];

  return (
    <div className="product-hero-overlay" role="dialog" aria-modal="true" ref={rootRef}>
      <div className="product-hero">
        {/* image */}
        <div style={{ width:'100%', display:'grid', placeItems:'center' }}>
          <Image
            src={product.image}
            alt={product.title}
            width={1000}
            height={800}
            className="product-hero-img"
            priority
          />
        </div>

        {/* title & price */}
        <div className="product-hero-title">{product.title}</div>
        <div className="product-hero-price">${(product.price/100).toFixed(2)}</div>

        {/* "+" centered, sizes appear BELOW it when activated */}
        <div style={{ display:'grid', justifyItems:'center', gap:10, marginTop:4 }}>
          <Pill
            aria-label="Add"
            active={plusOpen && !justAdded}
            ready={justAdded}
            onClick={handlePlus}
            className="w-[34px] h-[34px] !p-0"
          >
            +
          </Pill>

          {/* reveal sizes only when plusOpen */}
          {plusOpen && (
            <div className="row-nowrap" style={{ gap:8 }}>
              {['XS','S','M','L','XL']
                .filter((sz) => sizes.includes(sz)) // only show sizes the product actually has
                .map((sz) => (
                  <Pill key={sz} onClick={() => handlePickSize(sz)}>{sz}</Pill>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Grid */
export default function ShopGrid({ products }) {
  const [overlayId, setOverlayId] = useState(null);

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

      // reflect to CSS so layout updates
      document.documentElement.style.setProperty('--grid-cols', String(next));
      return next;
    });
  }, [down]);

  // hook up to orb
  useEffect(() => {
    const onZoom = (e) => {
      // If overlay open, ignore density and let overlay close handler consume it
      if (overlayId != null) return;
      stepCols();
    };
    window.addEventListener('lb:zoom', onZoom);
    return () => window.removeEventListener('lb:zoom', onZoom);
  }, [overlayId, stepCols]);

  // open product
  const open = (id) => setOverlayId(id);
  const close = () => setOverlayId(null);

  const overlayProduct = useMemo(
    () => products.find((p) => p.id === overlayId) || null,
    [overlayId, products]
  );

  return (
    <div className="shop-wrap" style={{ padding:'28px 28px 60px' }}>
      <div className="shop-grid" style={{ '--grid-cols': cols } }>
        {products.map((p) => (
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
                priority={p===products[0]}
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
        />
      )}
    </div>
  );
}
