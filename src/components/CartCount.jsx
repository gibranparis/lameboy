'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import swell from '@/lib/swell';

function sumQty(items) {
  return (items || []).reduce((n, it) => n + (Number(it.quantity) || 0), 0);
}

export default function CartCount({ className = '' }) {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  async function refresh() {
    try {
      const c = await swell.cart.get();
      setCount(sumQty(c?.items));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh(); // load on mount & on route change
    // update on window focus (user might add items in another tab)
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);

    // react to cross-tab "cart updated" pings
    const onStorage = (e) => {
      if (e.key === 'cart:updated') refresh();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // re-run when route changes

  if (!count) return null;
  return <span className={className}>{count}</span>;
}
