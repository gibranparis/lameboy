// src/lib/pickImage.js

/**
 * Utilities to pick product image URLs from Swell by simple "tags"
 * you place in the image caption, e.g.:
 *   desktop-webp, desktop-jpg, mobile-webp, mobile-jpg, thumb, zoom
 */

export function pickByTag(images = [], tag) {
  if (!Array.isArray(images) || !tag) return null;
  const t = String(tag).toLowerCase();
  const hit = images.find((i) => String(i?.caption || '').toLowerCase().includes(t));
  return hit?.file?.url || hit?.url || null;
}

export function pickByExt(images = [], re) {
  if (!Array.isArray(images)) return null;
  const rx = re || /\.(webp)$/i;
  const hit = images.find((i) => rx.test(i?.file?.url || i?.url || ''));
  return hit?.file?.url || hit?.url || null;
}

/**
 * Build a srcSet string from an array of {url,width} (you can prebuild this
 * if your CDN/asset host supports query transforms, e.g., ?w=600).
 */
export function buildSrcSet(items = []) {
  return items
    .filter((x) => x?.url && x?.width)
    .map((x) => `${x.url} ${x.width}w`)
    .join(', ');
}
