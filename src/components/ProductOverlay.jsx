'use client';

export default function ProductOverlay({ product, onClose }) {
  const [showSheet, setShowSheet] = useState(false);
  const { useState } = require('react'); // inline to avoid SSR import order complaints

  if (!product) return null;

  const title = product.name || product.slug || 'Product';
  const priceStr = product.price != null ? `$${Number(product.price).toFixed(0)}` : '';

  const img = product.images?.[0]?.file?.url;

  return (
    <div className="product-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <button className="po-close" onClick={onClose} aria-label="Back">‹</button>

      <div className="po-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img ? <img className="po-img" src={img} alt={title} /> : <div className="code-placeholder">no image</div>}

        <div className="po-meta">
          <div className="po-title">{title}</div>
          {priceStr && <div className="po-price">{priceStr}</div>}
        </div>

        <div className="po-actions">
          <button className="po-plus" onClick={() => setShowSheet(v => !v)} aria-expanded={showSheet} aria-controls="size-sheet">+</button>
        </div>
      </div>

      {showSheet && (
        <div id="size-sheet" className="size-sheet">
          <div className="sheet-row">
            <span style={{opacity:.7}}>?</span>
            <span className="sheet-title">SELECT SIZE</span>
            <button className="sheet-dismiss" onClick={() => setShowSheet(false)} aria-label="Close">×</button>
          </div>
          <div className="po-price" style={{textAlign:'center', marginBottom:14}}>{priceStr}</div>
          <div className="size-grid">
            {['S','M','L'].map(sz => (
              <button key={sz} className="size-btn" onClick={()=>setShowSheet(false)}>{sz}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
