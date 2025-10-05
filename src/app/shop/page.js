// Server component only — route config must live here.
export const dynamic = 'force-static'; // allow SSG
export const runtime = 'nodejs';       // opt /shop out of Edge so SSG works

import ShopClient from './ShopClient';

export default function Page() {
  return <ShopClient />;
}
