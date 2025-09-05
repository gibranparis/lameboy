// src/components/CartFlyout.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './CartFlyout.module.css';
import swell from '@/lib/swell-client';
import { useCartUI } from '@/contexts/CartUIContext';

export default function CartFlyout() {
  const { open, closeCart } = useCartUI();
  const [cart, setCart] = useState(null);
  const [busy, setBusy] = useState(false);
  const items = useMemo(() => cart?.items ?? [], [cart]);

  async function refresh() {
    try {
      const c = await swell.cart.get();
      setCart(c);
    } catch (err) {
      console.error('[cart] get failed', err);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
    const onOpen = () => refresh();
    const onStorage = (e) => { if (e.key === 'cart:updated') refresh(); };
    window.addEventListener('cart:open', onOpen);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('cart:open', onOpen);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  async function setQuantity(id, quantity) {
    try {
      setBusy(true);
      const q = Math.max(0, Number(quantity) || 0);
      if (q <= 0) await swell.cart.update({ items: [{ id, quantity: 0 }] });
      else await swell.cart.update({ items: [{ id, quantity: q }] });
      await refresh();
    } catch (err) {
      console.error('[cart] set qty failed', err);
      setBusy(false);
    }
  }

  async function removeItem(id) {
    try {
      setBusy(true);
      await swell.cart.update({ items: [{ id, quantity: 0 }] });
      await refresh();
    } catch (err) {
      console.error('[cart] remove failed', err);
      setBusy(false);
    }
  }

  function fmt(value, currency = cart?.currency || 'USD') {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value ?? 0); }
    catch { return `$${Number(value ?? 0).toFixed(2)}`; }
  }

  function firstImage(item) {
    const img = item?.images?.[0] || item?.product?.images?.[0];
    return img?.file?.url || img?.url || null;
  }

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.show : ''}`}
        onClick={closeCart}
      />

      <aside
        className={`${styles.panel} ${open ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className={styles.header}>
          <span className={styles.title}>Your Cart</span>
          <button className={styles.close} aria-label="Close cart" onClick={closeCart}>×</button>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <p className="muted">Your cart is empty.</p>
            </div>
          ) : (
            <div className={styles.items}>
              {items.map((it) => {
                const img = firstImage(it);
                const title = it?.product?.name || it?.product_id || 'Item';
                const unitPrice = fmt(it?.price);
                const lineTotal = fmt(it?.price_total);

                return (
                  <div className={styles.item} key={it.id}>
                    <div className={styles.thumb}>
                      {img && <Image src={img} alt={title} fill sizes="72px" style={{ objectFit: 'cover' }} />}
                    </div>

                    <div className={styles.meta}>
                      <div className={styles.name}>
                        <Link href={`/shop/${it?.product?.slug || it?.product_id}`}>{title}</Link>
                      </div>
                      <div className={styles.qtyRow}>
                        <span className="muted" style={{ fontSize: 12 }}>{unitPrice} • Qty</span>
                        <button className={styles.qtyBtn} disabled={busy || it.quantity <= 1} onClick={() => setQuantity(it.id, it.quantity - 1)} aria-label="Decrease quantity">−</button>
                        <span className={styles.qtyVal}>{it.quantity}</span>
                        <button className={styles.qtyBtn} disabled={busy} onClick={() => setQuantity(it.id, it.quantity + 1)} aria-label="Increase quantity">+</button>
                      </div>
                    </div>

                    <div className={styles.right}>
                      <div className={styles.lineTotal}>{lineTotal}</div>
                      <button className="btn ghost" disabled={busy} onClick={() => removeItem(it.id)}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.row}>
            <div className="muted">Subtotal</div>
            <div>{fmt(cart?.sub_total)}</div>
          </div>

          <div className={styles.actions}>
            <Link href="/cart" className="btn ghost" onClick={closeCart}>View full cart</Link>
            <button className="btn" disabled={busy || items.length === 0} onClick={closeCart}>
              Checkout →
            </button>
          </div>

          <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
            Taxes and shipping calculated at checkout.
          </p>
        </div>
      </aside>
    </>
  );
}
