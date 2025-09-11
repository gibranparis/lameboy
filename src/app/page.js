export const dynamic = 'force-dynamic'; // avoid static prerender of client-only bits

import BannedCard from '../components/BannedCard';

export default function Page() {
  return <BannedCard />;
}
