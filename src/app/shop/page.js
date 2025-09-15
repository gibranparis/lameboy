'use client';

import ShopGrid from '@/components/ShopGrid';

// Keep your demo data for local dev; swap to live later.
const demoProducts = [
  { id: 'tee-01', name: 'TEE 01', price: 4000, images: [{ url: '/placeholder.png' }] },
  { id: 'tee-02', name: 'TEE 02', price: 4200, images: [{ url: '/placeholder.png' }] },
  { id: 'hood-01', name: 'HOOD 01', price: 9000, images: [{ url: '/placeholder.png' }] },
];

export default function ShopPage() {
  return (
    <div className="shop-page">
      <div className="shop-wrap">
        <ShopGrid products={demoProducts} />
      </div>
    </div>
  );
}
