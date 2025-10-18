// src/components/ProductOverlay.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';

/** @typedef {{ id?:string; slug?:string; name?:string; title?:string; price?:number; image?:string; images?:string[]; thumbnail?:string; sizes?:string[] }} Product */

/**
 * Modal overlay showing a single product with image gallery, size selection, price,
 * and an Add to Cart action. Closes on ESC, backdrop click, or Close button.
 *
 * Usage:
 *   <ProductOverlay product={selected} onClose={() => setSelected(null)} />
 */
export default function ProductOverlay({
  product,
  onClose,
}) {
  const isOpen = !!product;

  // Defensive: normalize product fields so we don't crash if something's missing
  const {
    id,
    slug,
    name,
    title,
    price,
    image,
    images,
    thumbnail,
    sizes,
  } = product ?? /** @type {Product} */ ({});

  const displayTitle = name ?? title ?? 'Product';
  const displayPrice = typeof price === 'number' ? price : undefined;

  // Build a gallery list (image first, then others, deduped)
  const gallery = useMemo(() => {
    const list = [];
    const seen = new Set();
    const candidates = [
      image,
      ...(Array.isArray(images) ? images : []),
      thumbnail,
    ].filter(Boolean);
    for (const src of candidates) {
      if (!seen.has(src)) { seen.add(src); list.push(src); }
    }
    // Last resort
    if (list.length === 0) list.push('/placeholder.png');
    return list;
  }, [image, images, thumbnail]);

  // Sizes (fallback to common sizes if not provided)
  const availableSizes = useMemo(() => {
    if (Array.isArray(sizes) && sizes.length) return sizes;
    // sensible default set (you can customize per product in your JSON)
    return ['XS', 'S', 'M', 'L', 'XL'];
  }, [sizes]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [pickedSize, setPickedSize] = useState('');

  // Lock background scroll while open; close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const addToCart = () => {
    // You can wire this to your real cart; this event is a safe default.
    const detail = {
      productId: id ?? slug ?? displayTitle,
      slug: slug ?? null,
      name: displayTitle,
      price: displayPrice ?? 0,
      size: pickedSize || null,
      image: gallery[activeIdx],
      qty: 1,
    };
    try {
      window.dispatchEvent(new CustomEvent('cart:add', { detail }));
      // Give the cart button a nudge if it listens for a bump
      window.dispatchEvent(new CustomEvent('cart:bump', { detail: { delta: 1 } }));
    } catch {}
  };

  return (
    <div
      className="product-hero-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // close when clicking backdrop (not when clicking inside the card)
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {/* Close button */}
      <button className="product-hero-close" onClick={onClose} aria-label="Close product">
        ×
      </button>

      {/* Card */}
      <div className="product-hero">
        {/* Gallery */}
        <div style={{ width:'100%', display:'grid', gap:12 }}>
          <img
            src={gallery[activeIdx]}
            alt={displayTitle}
            className="product-hero-img"
            loading="eager"
            decoding="async"
          />
          {gallery.length > 1 && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
              {gallery.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Show image ${i+1}`}
                  style={{
                    width: 60, height: 60,
                    borderRadius: 8,
                    border: i === activeIdx ? '2px solid #111' : '1px solid rgba(0,0,0,.18)',
                    background:'transparent', padding:0, overflow:'hidden', cursor:'pointer'
                  }}
                >
                  <img
                    src={src}
                    alt=""
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Meta */}
        <div style={{ display:'grid', gap:8, width:'100%' }}>
          <div className="product-hero-title">{displayTitle}</div>
          {displayPrice !== undefined && (
            <div className="product-hero-price">${displayPrice.toFixed(2)}</div>
          )}

          {/* Size selector */}
          {availableSizes.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:8, opacity:.9 }}>Size</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPickedSize(s)}
                    aria-pressed={pickedSize === s}
                    style={{
                      minWidth:48, height:40, padding:'0 12px',
                      borderRadius:10, cursor:'pointer', fontWeight:800,
                      border: pickedSize === s ? '2px solid #111' : '1px solid rgba(0,0,0,.2)',
                      background: pickedSize === s ? 'rgba(0,0,0,.06)' : 'transparent'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display:'flex', gap:10, marginTop:12 }}>
            <button
              onClick={addToCart}
              disabled={availableSizes.length > 0 && !pickedSize}
              style={{
                flex:'1 1 auto', height:46, borderRadius:12, cursor:'pointer',
                border:'1px solid rgba(0,0,0,.22)',
                background:'#111', color:'#fff', fontWeight:900,
                opacity: availableSizes.length > 0 && !pickedSize ? .6 : 1
              }}
            >
              Add to cart
            </button>

            {/* Optional: go to page if you have a slug */}
            {slug && (
              <a
                href={`/shop/${encodeURIComponent(slug)}`}
                style={{
                  flex:'0 0 auto', height:46, borderRadius:12, display:'grid', placeItems:'center',
                  padding:'0 16px',
                  border:'1px solid rgba(0,0,0,.22)', background:'transparent', color:'#111',
                  fontWeight:800, textDecoration:'none'
                }}
              >
                View page
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
