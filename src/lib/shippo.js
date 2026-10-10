// src/lib/shippo.js
// Server-only Shippo client for live shipping rates. Must only be imported
// from route handlers (src/app/api/**).
import { Shippo } from 'shippo'

let shippoClient = null

function getShippo() {
  if (!shippoClient) {
    const key = process.env.SHIPPO_API_KEY
    if (!key) throw new Error('SHIPPO_API_KEY is not set')
    shippoClient = new Shippo({ apiKeyHeader: key })
  }
  return shippoClient
}

/** Origin address every shipment ships from. Configured via env vars. */
function getOriginAddress() {
  const {
    SHIPPO_ORIGIN_NAME,
    SHIPPO_ORIGIN_ADDRESS1,
    SHIPPO_ORIGIN_ADDRESS2,
    SHIPPO_ORIGIN_CITY,
    SHIPPO_ORIGIN_STATE,
    SHIPPO_ORIGIN_ZIP,
    SHIPPO_ORIGIN_COUNTRY,
    SHIPPO_ORIGIN_PHONE,
    SHIPPO_ORIGIN_EMAIL,
  } = process.env

  if (!SHIPPO_ORIGIN_ADDRESS1 || !SHIPPO_ORIGIN_CITY || !SHIPPO_ORIGIN_ZIP || !SHIPPO_ORIGIN_COUNTRY) {
    throw new Error('SHIPPO_ORIGIN_* env vars are not fully set')
  }

  return {
    name: SHIPPO_ORIGIN_NAME || 'Lameboy',
    street1: SHIPPO_ORIGIN_ADDRESS1,
    street2: SHIPPO_ORIGIN_ADDRESS2 || undefined,
    city: SHIPPO_ORIGIN_CITY,
    state: SHIPPO_ORIGIN_STATE || undefined,
    zip: SHIPPO_ORIGIN_ZIP,
    country: SHIPPO_ORIGIN_COUNTRY,
    phone: SHIPPO_ORIGIN_PHONE || undefined,
    email: SHIPPO_ORIGIN_EMAIL || undefined,
  }
}

/**
 * International shipments need a customs declaration attached, or Shippo
 * won't return carrier rates that require one. Built from the same cart
 * lines the parcel weight comes from.
 *
 * @param {Array<{variant:{weight_oz:number,price_cents:number,products?:{name?:string}}, qty:number}>} lines
 */
async function createCustomsDeclaration(lines) {
  const shippo = getShippo()

  const declaration = await shippo.customsDeclarations.create({
    contentsType: 'MERCHANDISE',
    nonDeliveryOption: 'RETURN',
    certify: true,
    certifySigner: 'Lameboy',
    items: lines.map((l) => ({
      description: l.variant.products?.name ?? 'Merchandise',
      quantity: l.qty,
      netWeight: String(l.variant.weight_oz * l.qty),
      massUnit: 'oz',
      valueAmount: String((l.variant.price_cents / 100) * l.qty),
      valueCurrency: 'USD',
      originCountry: 'US',
    })),
  })

  return declaration.objectId
}

/**
 * Quote live shipping rates for a destination + a set of variants.
 * All line items are combined into a single parcel: weights sum, and
 * dimensions use the largest single-variant box in the cart — a reasonable
 * approximation for a small apparel store where every item ships in a
 * similar poly mailer/box.
 *
 * `address1`/`city`/`name`/`phone` are optional — a ZIP + country alone is
 * enough for Shippo to quote a "reference" rate (used by the cart drawer's
 * lightweight shipping estimate); the full address just yields more
 * accurate numbers, which the real checkout flow always provides.
 *
 * @param {{name?:string, address1?:string, address2?:string, city?:string, state?:string, zip:string, country:string, phone?:string}} destination
 * @param {Array<{variant:{weight_oz:number,length_in:number,width_in:number,height_in:number,price_cents:number,products?:{name?:string}}, qty:number}>} lines
 */
export async function getShippingRates(destination, lines) {
  const shippo = getShippo()

  const totalWeightOz = lines.reduce((sum, l) => sum + l.variant.weight_oz * l.qty, 0)
  const length = Math.max(...lines.map((l) => l.variant.length_in))
  const width = Math.max(...lines.map((l) => l.variant.width_in))
  const height = lines.reduce((sum, l) => sum + l.variant.height_in * l.qty, 0)

  const isInternational = destination.country !== 'US'
  const customsDeclaration = isInternational ? await createCustomsDeclaration(lines) : undefined

  const shipment = await shippo.shipments.create({
    addressFrom: getOriginAddress(),
    addressTo: {
      name: destination.name || 'Customer',
      street1: destination.address1 || undefined,
      street2: destination.address2 || undefined,
      city: destination.city || undefined,
      state: destination.state || undefined,
      zip: destination.zip,
      country: destination.country,
      phone: destination.phone || undefined,
    },
    parcels: [
      {
        massUnit: 'oz',
        weight: String(Math.max(totalWeightOz, 1)),
        distanceUnit: 'in',
        length: String(Math.max(length, 1)),
        width: String(Math.max(width, 1)),
        height: String(Math.max(height, 1)),
      },
    ],
    customsDeclaration,
    async: false,
  })

  const rates = (shipment.rates ?? [])
    .map((rate) => ({
      id: rate.objectId,
      provider: rate.provider,
      name: rate.servicelevel?.name ?? rate.provider,
      description: rate.durationTerms || (rate.estimatedDays ? `${rate.estimatedDays} business day(s)` : ''),
      price: Math.round(parseFloat(rate.amount) * 100),
    }))
    .sort((a, b) => a.price - b.price)

  return rates
}

/** Re-fetch a rate by its Shippo object id so checkout never trusts a client-sent price. */
export async function getRateById(rateId) {
  const shippo = getShippo()
  const rate = await shippo.rates.get(rateId)
  return {
    id: rate.objectId,
    provider: rate.provider,
    name: rate.servicelevel?.name ?? rate.provider,
    price: Math.round(parseFloat(rate.amount) * 100),
  }
}
