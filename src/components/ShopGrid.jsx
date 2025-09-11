'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ShopGrid() {
  const [products, setProducts] = useState([]);
  const [density, setDensity] = useState(4); // 5→most tiles, 1→largest tiles
  const [girlMode, setGirlMode] = useState(false);

  // cart (persisted)
  const [cart, setCart] = useState([]);
  const cartCount = cart.reduce((n, i) => n + (i.qty || 1), 0);
  const [cartBump, setCartBump] = useState(false);
  const [badgeSwap, setBadgeSwap] = useState(null); // 'green' | null

  // toggle pulse class
  const [toggleGlow, setToggleGlow] = useState(null); // 'blue' | 'green' | null

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lb_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('lb_cart', JSON.stringify(cart)); } catch {}
  }, [cart]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('../lib/swell-client');
        const swell = mod.default || mod.swell || mod;
        const res = await swell.products.list({ limit: 60 });
        if (mounted && res?.results) setProducts(res.results);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const gridStyle = useMemo(() => {
    const tile = ({5:'150px',4:'180px',3:'200px',2:'230px',1:'280px'}[density]);
    const gap  = ({5:'20px', 4:'24px', 3:'28px', 2:'30px', 1:'34px' }[density]);
    return { ['--tile']: tile, ['--gap']: gap };
  }, [density]);

  // change density: click reduces until 1, then goes to 2
  const clickDensity = () => { if (density > 1) setDensity(density - 1); else setDensity(2); };
  const densityIcon = density > 1 ? '+' : '–';

  // modal for product detail
  const [active, setActive] = useState(null);
  const [openOptions, setOpenOptions] = useState(false);

  // NEW: numbers→letters toggle
  const [useNumbers, setUseNumbers] = useState(true);

  useEffect(() => {
    if (active) { setOpenOptions(false); setUseNumbers(true); }
  }, [active]);

  function addToCart(product, label) {
    // Map numeric labels to sizes
    const size = (label === '1') ? 'S' : (label === '2') ? 'M' : (label === '3') ? 'L' : label;
    setCart(prev => {
      const key = (product.id || product.slug || product.name) + '|' + size;
      const idx = prev.findIndex(i => i.key === key);
      const next = [...prev];
      if (idx >= 0) next[idx] = { ...next[idx], qty: (next[idx].qty || 1) + 1 };
      else next.push({ key, id: product.id || product.slug, sku: product.sku, name: product.name, size, qty: 1 });
      return next;
    });
    setCartBump(true);
    setTimeout(() => setCartBump(false), 380);
  }

  function toggleMode() {
    const next = !girlMode;
    setGirlMode(next);
    // always keep badge green but pulse it
    setBadgeSwap('green');
    setTimeout(() => setBadgeSwap(null), 520);

    // add glow on the toggle text (blue for boy, green for girl)
    setToggleGlow(next ? 'green' : 'blue');
    setTimeout(() => setToggleGlow(null), 720);
  }

  const sizeLabels = useNumbers ? ['1','2','3'] : ['S','M','L'];

  return (
    <div className="shop-page">
      <div className="shop-wrap">
        {/* density control (top-left) */}
        <button className="shop-density" onClick={clickDensity} aria-label="Change grid density">
          {densityIcon}
        </button>

        {/* gender toggle (center-top) */}
        <button
          className={[
            'shop-toggle',
            girlMode ? 'shop-toggle--girl' : 'shop-toggle--boy',
            toggleGlow === 'blue'  ? 'glow-blue'  : '',
            toggleGlow === 'green' ? 'glow-green' : ''
          ].join(' ').trim()}
          onClick={toggleMode}
          aria-label={girlMode ? 'LAMEGIRL' : 'LAMEBOY'}
        >
          {girlMode ? 'LAMEGIRL' : 'LAMEBOY'}
        </button>

        {/* CART with green badge (top-right, always visible above overlay) */}
        <button
          className={`cart-fab ${cartBump ? 'bump' : ''}`}
          aria-label="Cart"
          title="Cart"
          onClick={()=>{}}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/>
          </svg>
          {cartCount > 0 && (
            <span className={['cart-badge', badgeSwap === 'green' ? 'swap-green' : ''].join(' ').trim()}>
              {cartCount}
            </span>
          )}
        </button>

        {/* grid */}
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

        {/* detail overlay */}
        {active && (
          <div className="product-hero-overlay" onClick={()=>setActive(null)}>
            {/* CLOSE (top-left) as '<' */}
            <button className="product-hero-close" onClick={()=>setActive(null)} aria-label="Close overlay">&lt;</button>

            <div className="product-hero" onClick={(e)=>e.stopPropagation()}>
              <img
                className="product-hero-img"
                src={active.images?.[0]?.file?.url || active.images?.[0]?.src || active.image?.file?.url || active.image?.src}
                alt={active.name || 'product'}
              />

              <div className="product-hero-title">{active.sku || active.meta?.code || active.name}</div>
              {active.price && <div className="product-hero-price">${active.price}</div>}

              {/* Collapsed -> big + ; Expanded -> options header + sizes */}
              {!openOptions ? (
                <button className="hero-plus" onClick={()=>setOpenOptions(true)} aria-label="Open size options">+</button>
              ) : (
                <>
                  <div className="options-header">
                    <button
                      className="icon-chip"
                      onClick={()=>setUseNumbers(n => !n)}
                      aria-label="Toggle size labels"
                      title={useNumbers ? 'Switch to S/M/L' : 'Switch to 1/2/3'}
                    >?</button>
                    <div className="options-title">SELECT SIZE</div>
                    <button className="icon-chip" onClick={()=>setOpenOptions(false)} aria-label="Collapse options">&lt;</button>
                  </div>

                  <div style={{ display:'flex', gap:18, marginTop:10, justifyContent:'center' }}>
                    {sizeLabels.map(lbl => (
                      <button
                        key={lbl}
                        className="commit-btn"
                        onClick={() => addToCart(active, lbl)}
                        aria-label={`Choose ${lbl}`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
