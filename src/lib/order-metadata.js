// src/lib/order-metadata.js
// Stripe caps metadata values at 500 characters (and 50 keys total), so the
// cart can't ride along as a single JSON string once it grows past a few
// items. encodeItems splits the JSON across items_0, items_1, ... keys;
// decodeItems stitches them back together for the webhook.

const CHUNK_SIZE = 480
const MAX_CHUNKS = 30

export function encodeItems(lineItems) {
  const json = JSON.stringify(lineItems)
  const chunkCount = Math.ceil(json.length / CHUNK_SIZE)
  if (chunkCount > MAX_CHUNKS) {
    throw new Error(`Cart too large for PaymentIntent metadata (${chunkCount} chunks, max ${MAX_CHUNKS})`)
  }

  const out = {}
  for (let i = 0; i < chunkCount; i++) {
    out[`items_${i}`] = json.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
  }
  return out
}

export function decodeItems(metadata) {
  const md = metadata ?? {}
  if (md.items_0 == null) {
    // Legacy PaymentIntents created before chunking stored a single `items` key.
    return JSON.parse(md.items || '[]')
  }

  let json = ''
  for (let i = 0; md[`items_${i}`] != null; i++) {
    json += md[`items_${i}`]
  }
  return JSON.parse(json)
}
