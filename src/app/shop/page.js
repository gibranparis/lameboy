'use client';

import { useEffect, useState } from 'react';
import ShopGrid from '../../components/ShopGrid';

export default function ShopPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Try dynamic import of swell-js only in the browser
        const swell = (await import('swell-js')).default;
        const store = process.env.NEXT_PUBLIC_SWELL_STORE_ID;
        const pk    = process.env.NEXT_PUBLIC_SWELL_PUBLIC_KEY;
        if (store && pk) swell.init(store, pk);

        const list = await swell.products.list({ page: 1, limit: 96, active: true });
        const items = list?.results ?? list ?? [];
        if (mounted) setProducts(Array.isArray(items) ? items : []);
      } catch (err) {
        // Fallback demo item if Swell isn’t available so builds don’t fail
        if (mounted) {
          setProducts([
            { id: 'demo-oxford', name: 'Oxford', price: 60, image: '/placeholder.png' },
          ]);
        }
      }
    })();

    return () => { mounted = false; };
  }, []);

  return <ShopGrid products={products} />;
}
