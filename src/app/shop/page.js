'use client';

export const dynamic = 'force-static';  // allow SSG
export const runtime = 'nodejs';        // opt out of edge so SSG works

import ShopClient from './ShopClient';

export default function ShopPage() {
  return (
    <div data-shop-root>
      <ShopClient />
    </div>
  );
}
