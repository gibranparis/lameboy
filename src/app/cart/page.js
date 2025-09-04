// src/app/cart/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import swell from '@/lib/swell';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); // disables controls during updates

  const items = useMemo(() => cart?.items ?? [], [cart]);

  // Helpers for flyout state + broadcast
  const openFlyout = () => {
    try { window.dispatchEvent(new Event('cart:open')); } catch {}
  };
  const closeFlyout = () => {
    try { window.dispatchEvent(new Event('cart:close')); } catch {}
  };
  async function broadcastUpdate() {
    try { localStorage.setItem('cart:updated', String(Date.now())); } catch {}
  }

  async function refresh() {
    try {
      setLoading(true);
      const c = await swell.cart.get();
      setCart(c);
    } catch (err) {
      console.error('[cart] get failed', err);
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();

    const onFocus = () => refresh();
    const onStorage = (e) => {
      if (e.key === 'cart:updated') refresh();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  async function removeItem(id) {
    try {
      setBusy(true);
      await swell.cart.removeItem(id);
      openFlyout();           // show updated state
      await refresh();
      await broadcastUpdate();
    } catch (err) {
      console.error('[cart] remove failed', err);
      setBusy(false);
    }
  }

  async function setQuantity(id, quantity) {
    try {
      setBusy(true);
      const q = Math.max(0, Number(quantity) || 0);
      if (q <= 0) {
        await swell.cart.removeItem(id);
      } else {
        await swell.cart.updateItem(id, { quantity: q });
      }
      openFlyout();           // show updated state
      await refresh();
      await broadcastUpdate();
    } catch (err) {
      console.error('[cart] set qty failed', err);
      setBusy(false);
    }
  }

  async function toCheckout() {
    try {
      setBusy(true);
      const { url } = await swell.cart.checkout();
      if (url) {
        closeFlyout();        // ✅ close flyout before redirect
        window.location.href = url;
      } else {
        throw new Error('No checkout URL');
      }
    } catch (err) {
      console.error('[cart] checkout failed', err);
      setBusy(false);
      alert('Checkout failed. Please try again.');
    }
  }

  function fmtMoney(value, currency = cart?.currency || 'USD') {
    if (value == null) return '—';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
    } catch {
      return `$${Number(value).toFixed(2)}`;
    }
  }

  function firstImage(item) {
    const img = item?.images?.[0] || item?.product?.images?.[0];
    return img?.file?.url || img?.url || null;
  }

  if (loading) {
    return (
      <main className="container" style={{ paddingTop: 24 }}>
        <p className="muted">Loading cart…</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Your Cart</h1>

      {items.length === 0 ? (
        <div>
          <p className="muted" style={{ marginBottom: 12 }}>Your cart is empty.</p>
          <Link className="btn" href="/shop">Go to Shop →</Link>
        </div>
      ) : (
        <div className="card">
          {/* Line items */}
          {items.map((it) => {
            const img = firstImage(it);
            const title = it?.product?.name || it?.product_id || 'Item';
            const priceTotal = fmtMoney(it?.price_total);
            const unitPrice = fmtMoney(it?.price);

            return (
              <div
                key={it.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #eaeaea',
                }}
              >
                <div style={{ position: 'relative', width: 72, height: 72, background: '#f3f3f3', borderRadius: 8, overflow: 'hidden' }}>
                  {img && (
                    <Image
                      src={img}
                      alt={title}
                      fill
                      sizes="72px"
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {unitPrice} • Qty{' '}
                    <button
                      type="button"
                      disabled={busy || it.quantity <= 1}
                      onClick={() => setQuantity(it.id, it.quantity - 1)}
                      className="qty"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="qtyValue">{it.quantity}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setQuantity(it.id, it.quantity + 1)}
                      className="qty"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 80, textAlign: 'right' }}>{priceTotal}</div>
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={busy}
                    onClick={() => removeItem(it.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <div className="muted">Subtotal</div>
            <div>{fmtMoney(cart?.sub_total)}</div>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Link className="btn ghost" href="/shop">Continue shopping</Link>
            <button type="button" className="btn" disabled={busy} onClick={toCheckout}>
              Proceed to Checkout →
            </button>
          </div>

          <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
            Taxes and shipping calculated at checkout.
          </p>
        </div>
      )}
    </main>
  );
}
