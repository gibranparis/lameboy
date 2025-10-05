// Server component only — route config must live here.
export const dynamic = 'force-static';
export const runtime = 'nodejs';

import ShopClient from './ShopClient';

export default function Page() {
  // The data-shop-root attribute lets CSS flip the global theme without JS.
  return (
    <div data-shop-root>
      <ShopClient />
    </div>
  );
}
