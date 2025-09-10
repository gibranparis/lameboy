'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ShopGrid() {
  const [products, setProducts] = useState([]);
  const [density, setDensity] = useState(4); // 5→most tiles, 1→largest tiles
  const [girlMode, setGirlMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('../lib/swell-client');
        const swell = mod.default || mod.swell || mod;
        const res = await swell.products.list({ limit: 60 });
        if (mounted && res?.results) setProducts(res.results);
      } catch {/* optional */}
    })();
    return () => { mounted = false; };
  }, []);

  const gridStyle = useMemo(() => {
    const tile = ({5:'150px',4:'180px',3:'200px',2:'230px',1:'280px'}[density]);
    const gap  = ({5:'20px', 4:'24px', 3:'28px', 2:'30px', 1:'34px' }[density]);
    return { ['--tile']: tile, ['--gap']: gap };
  }, [density]);

  const clickDensity = () => { if (density > 1) setDensity(density - 1); else setDensity(2); };
  const densityIcon = density > 1 ? '+' : '<';

  const [active, setActive] = useState(null);

  return (
    <div className="shop-page">
      <div className="shop-wrap">
        <button className="shop-density" onClick={clickDensity} aria-label="Change grid density">
          {densityIcon}
        </button>

        <button
          className={`shop-toggle ${girlMode ? 'shop-toggle--girl' : 'shop-toggle--boy'}`}
          onClick={() => setGirlMode(v => !v)}
          aria-label={girlMode ? 'LAMEGIRL' : 'LAMEBOY'}
        >
          {girlMode ? 'LAMEGIRL' : 'LAMEBOY'}
        </button>

        <div className="shop-grid" style={gridStyle}>
          {products.map(p => (
            <a
              key={p.id || p.slug}
              className="product-tile"
              onClick={(e)=>{ e.preventDefault(); setActive(p); }}
              href={`/product/${p.slug || p.id}`}
            >
              <div className="product-box">
                <img
                  className="product-img"
                  src={p.images?.[0]?.file?.url || p.images?.[0]?.src || p.image?.file?.url || p.image?.src}
                  alt={p.name || p.slug || 'product'}
                  loading="lazy"
                />
              </div>
              <div className="product-meta">{p.sku || p.meta?.code || p.name}</div>
            </a>
          ))}
        </div>

        {active && (
          <div className="product-hero-overlay" onClick={()=>setActive(null)}>
            <div className="product-hero" onClick={(e)=>e.stopPropagation()}>
              <img
                className="product-hero-img"
                src={active.images?.[0]?.file?.url || active.images?.[0]?.src || active.image?.file?.url || active.image?.src}
                alt={active.name || 'product'}
              />
              <div className="product-hero-title">{active.sku || active.meta?.code || active.name}</div>
              {active.price && <div className="product-hero-price">${active.price}</div>}

              <div style={{ display:'flex', gap:18, marginTop:6, justifyContent:'center' }}>
                {['S','M','L'].map(s => (
                  <button key={s} className="commit-btn" onClick={()=>{ /* hook to cart */ }} aria-label={`Select size ${s}`}>{s}</button>
                ))}
              </div>

              <div style={{ marginTop:10 }}>
                <button className="commit-btn" onClick={()=>setActive(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
