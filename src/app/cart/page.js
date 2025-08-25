'use client';
import { useEffect, useState } from 'react';
import swell from '@/lib/swell';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const c = await swell.cart.get();
    setCart(c);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function removeItem(id) {
    await swell.cart.update({ items: [{ id, quantity: 0 }] });
    refresh();
  }

  async function toCheckout() {
    const { url } = await swell.cart.checkout();
    if (url) window.location.href = url;
  }

  if (loading) return <main className="container"><p>Loading cart…</p></main>;
  const items = cart?.items || [];

  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Your Cart</h2>
      {items.length === 0 ? (
        <p className="muted">Cart is empty.</p>
      ) : (
        <div className="card">
          {items.map(it => (
            <div key={it.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #1a1a1a' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:56, height:56, background:'#151515', borderRadius:8 }} />
                <div>
                  <div style={{ fontSize:14 }}>{it.product?.name || it.product_id}</div>
                  <div className="muted" style={{ fontSize:12 }}>Qty {it.quantity}</div>
                </div>
              </div>
              <div>${Number(it.price_total || 0).toFixed(2)}</div>
              <button className="btn" onClick={() => removeItem(it.id)}>Remove</button>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:16 }}>
            <div className="muted">Subtotal</div>
            <div>${Number(cart?.sub_total || 0).toFixed(2)}</div>
          </div>
          <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end' }}>
            <button className="btn" onClick={toCheckout}>Proceed to Checkout →</button>
          </div>
        </div>
      )}
    </main>
  );
}
