'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import swell from '@/lib/swell';
import { useCartUI } from '@/contexts/CartUIContext';
import styles from './CartFlyout.module.css';

export default function CartFlyout() {
  const { open, closeCart } = useCartUI();
  const [cart, setCart] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const c = await swell.cart.get();
        if (alive) setCart(c);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open]);

  const broadcast = React.useCallback(() => {
    try { localStorage.setItem('cart:updated', String(Date.now())); } catch {}
  }, []);

  async function setQty(id, qty) {
    setUpdating(true);
    try {
      const q = Math.max(0, Number(qty) || 0);
      if (q <= 0) await swell.cart.removeItem(id);
      else await swell.cart.updateItem(id, { quantity: q });
      const c = await swell.cart.get();
      setCart(c);
      broadcast();
    } finally {
      setUpdating(false);
    }
  }

  async function removeItem(id) {
    setUpdating(true);
    try {
      await swell.cart.removeItem(id);
      const c = await swell.cart.get();
      setCart(c);
      broadcast();
    } finally {
      setUpdating(false);
    }
  }

  async function goCheckout() {
    try {
      const { url } = await swell.cart.checkout();
      if (url) {
        window.dispatchEvent(new Event('cart:close')); // close before leaving
        window.location.href = url;
      }
    } catch (e) {
      console.error('checkout failed', e);
      alert('Checkout failed. Please try again.');
    }
  }

  const money = (n, cur = cart?.currency || 'USD') => {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n || 0); }
    catch { return `$${Number(n || 0).toFixed(2)}`; }
  };

  const firstImg = (item) => {
    const img = item?.product?.images?.[0];
    return img?.file?.url || img?.url || null;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${open ? styles.show : ''}`}
        onClick={closeCart}
        aria-hidden={!open}
      />

      {/* Panel */}
      <aside
        className={`${styles.panel} ${open ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>Your Cart</div>
          <button className={styles.close} aria-label="Close cart" onClick={closeCart}>×</button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : !cart?.items?.length ? (
            <div className={styles.empty}>Your cart is empty.</div>
          ) : (
            <ul className={styles.items}>
              {cart.items.map((item) => {
                const img = firstImg(item);
                return (
                  <li key={item.id} className={styles.item}>
                    <div className={styles.thumb}>
                      {img && (
                        <Image
                          src={img}
                          alt={item.product?.name || ''}
                          fill
                          sizes="72px"
                          style={{ objectFit: 'cover' }}
                        />
                      )}
                    </div>

                    <div className={styles.meta}>
                      <div className={styles.name}>
                        <Link href={`/shop/${item.product?.slug || item.product_id}`} onClick={closeCart}>
                          {item.product?.name || 'Item'}
                        </Link>
                      </div>

                      {item?.variant && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {Object.values(item.variant?.options || {}).join(' / ')}
                        </div>
                      )}

                      <div className={styles.qtyRow}>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          disabled={updating || item.quantity <= 1}
                          onClick={() => setQty(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >−</button>

                        <span className={styles.qtyVal}>{item.quantity}</span>

                        <button
                          type="button"
                          className={styles.qtyBtn}
                          disabled={updating}
                          onClick={() => setQty(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >＋</button>

                        <button
                          type="button"
                          style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)' }}
                          disabled={updating}
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className={styles.right}>
                      <div className={styles.lineTotal}>{money(item.price_total)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.row}>
            <span className="muted">Subtotal</span>
            <strong>{money(cart?.sub_total)}</strong>
          </div>

          <div className={styles.actions}>
            <Link href="/cart" className="btn ghost" onClick={closeCart}>
              View full cart
            </Link>
            <button className="btn" onClick={goCheckout} disabled={updating}>
              Checkout
            </button>
          </div>

          <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
            Taxes and shipping calculated at checkout.
          </div>
        </div>
      </aside>
    </>
  );
}
