import { headers } from 'next/headers'
import CheckoutFlow from '@/components/CheckoutFlow'

export const metadata = {
  title: 'Checkout - LAMEBOY',
}

export default async function CheckoutPage() {
  // Vercel's IP geolocation headers — absent in local dev, so CheckoutFlow
  // falls back to its normal defaults when these are null.
  const h = await headers()
  const geoCountry = h.get('x-vercel-ip-country')
  const geoRegion = h.get('x-vercel-ip-country-region')
  return <CheckoutFlow geoCountry={geoCountry} geoRegion={geoRegion} />
}
