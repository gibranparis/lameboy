// src/components/CartCount.jsx
'use client';

import { useEffect, useState } from 'react';
import swell from '@/lib/swell-client';

export default function CartCount({ className = '' }) {
  const [count, setCount] = useState(0);

  async function refresh() {
    try {
      const c = await swell.cart.get();
      setCount(c?.item_quantity || 0);
    } catch (_) {}
  }

  useEffect(() => {
    refresh();
    const onStorage = (e) => { if (e.key === 'cart:updated') refresh(); };
    const onOpen = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('cart:open', onOpen);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cart:open', onOpen);
    };
  }, []);

  if (!count) return null;
  return <span className={className}>{count}</span>;
}
