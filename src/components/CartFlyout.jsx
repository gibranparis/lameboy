// src/components/CartFlyout.jsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CartFlyout.module.css';

import { useCartUI } from '@/contexts/CartUIContext';
import { useCart } from '@/contexts/CartContext';

export default function CartFlyout() {
  const { open, closeCart } = useCartUI();
  const { cart, loading, updating, itemCount, setItemQty, removeItem, total, currency } = useCart();

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <aside className={styles.overlay} onClick={closeCart}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h3 className={styles.title}>Your cart ({itemCount})</h3>
          <button className={styles.close} onClick={closeCart} aria-label="Close cart">×</button>
        </header>

        {loading ? (
          <div className={styles.empty}>Loading…</div>
        ) : (cart?.items?.length ? (
          <ul className={styles.items}>
            {cart.items.map((it) => (
              <li key={it.id} className={styles.item}>
                <div className={styles.thumb}>
                  {it.product?.images?.[0]?.file?.url ? (
                    <Image
                      src={it.product.images[0].file.url}
                      alt={it.product?.name || 'Product'}
                      width={72}
                      height={72}
                    />
                  ) : null}
                </div>
                <div className={styles.meta}>
                  <Link href={`/shop/${it.product?.slug || ''}`} className={styles.name} onClick={closeCart}>
                    {it.product?.name || 'Product'}
                  </Link>
                  <div className={styles.controls}>
                    <button disabled={updating} onClick={() => setItemQty(it.id, it.quantity - 1)}>-</button>
                    <input
                      className={styles.qty}
                      type="number"
                      min={0}
                      value={it.quantity}
                      onChange={(e) => setItemQty(it.id, Number(e.target.value))}
                    />
                    <button disabled={updating} onClick={() => setItemQty(it.id, it.quantity + 1)}>+</button>
                    <button className={styles.remove} disabled={updating} onClick={() => removeItem(it.id)}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className={styles.price}>
                  {formatMoney(it.priceTotal || it.price, it.currency || currency)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>Your cart is empty.</div>
        ))}

        <footer className={styles.footer}>
          <div className={styles.totalRow}>
            <span>Total</span>
            <strong>{formatMoney(total, currency)}</strong>
          </div>
          <div className={styles.ctaRow}>
            <Link href="/cart" className={styles.link} onClick={closeCart}>View cart</Link>
            <button
              className={styles.checkout}
              disabled={!itemCount || updating}
              onClick={() => (window.location.href = '/api/checkout')}
            >
              Checkout
            </button>
          </div>
        </footer>
      </div>
    </aside>
  );
}

function formatMoney(n, currency = 'USD') {
  const num = Number(n || 0);
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num); }
  catch { return `$${num.toFixed(2)}`; }
}
