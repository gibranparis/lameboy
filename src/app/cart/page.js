// src/app/cart/page.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
  const { cart, loading, updating, itemCount, setItemQty, removeItem, total, currency } = useCart();

  if (loading) return <main style={{ padding: '2rem 1rem' }}>Loading…</main>;

  if (!itemCount) {
    return (
      <main style={{ padding: '2rem 1rem' }}>
        <h1>Your cart is empty</h1>
        <p><Link href="/shop">Continue shopping →</Link></p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem 1rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Cart</h1>

      <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
        {cart.items.map((it) => (
          <li key={it.id} style={{ display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <div>
              {it.product?.images?.[0]?.file?.url ? (
                <Image
                  src={it.product.images[0].file.url}
                  alt={it.product?.name || 'Product'}
                  width={96}
                  height={96}
                />
              ) : null}
            </div>
            <div>
              <Link href={`/shop/${it.product?.slug || ''}`}>{it.product?.name || 'Product'}</Link>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <button disabled={updating} onClick={() => setItemQty(it.id, it.quantity - 1)}>-</button>
                <input
                  type="number"
                  min={0}
                  value={it.quantity}
                  onChange={(e) => setItemQty(it.id, Number(e.target.value))}
                  style={{ width: 64 }}
                />
                <button disabled={updating} onClick={() => setItemQty(it.id, it.quantity + 1)}>+</button>
                <button onClick={() => removeItem(it.id)} disabled={updating} style={{ marginLeft: 8 }}>Remove</button>
              </div>
            </div>
            <div style={{ justifySelf: 'end' }}>
              {formatMoney(it.priceTotal || it.price, it.currency || currency)}
            </div>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <strong>Total</strong>
        <strong>{formatMoney(total, currency)}</strong>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Link href="/shop">Continue shopping</Link>
        <button
          disabled={!itemCount || updating}
          onClick={() => (window.location.href = '/api/checkout')}
        >
          Checkout
        </button>
      </div>
    </main>
  );
}

function formatMoney(n, currency = 'USD') {
  const num = Number(n || 0);
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num); }
  catch { return `$${num.toFixed(2)}`; }
}
