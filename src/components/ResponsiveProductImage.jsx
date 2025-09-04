// src/components/ResponsiveProductImage.jsx
/**
 * Art-direction + format fallback using <picture>.
 *
 * Usage:
 * <ResponsiveProductImage
 *   images={product.images}
 *   // captions you set in Swell for each image:
 *   map={{
 *     desktopWebp: 'desktop-webp',
 *     desktopJpg:  'desktop-jpg',
 *     mobileWebp:  'mobile-webp',
 *     mobileJpg:   'mobile-jpg',
 *   }}
 *   alt={product.name}
 * />
 *
 * If none of the tags are found, it renders nothing (so the page can fall back to <Image/>).
 */

import React from 'react';
import { pickByTag } from '@/lib/pickImage';

export default function ResponsiveProductImage({ images = [], map = {}, alt = '' }) {
  const desktopWebp = pickByTag(images, map.desktopWebp || 'desktop-webp');
  const desktopJpg  = pickByTag(images, map.desktopJpg  || 'desktop-jpg');
  const mobileWebp  = pickByTag(images, map.mobileWebp  || 'mobile-webp');
  const mobileJpg   = pickByTag(images, map.mobileJpg   || 'mobile-jpg');

  // If we have at least a final <img> fallback, render the picture.
  const finalFallback = mobileJpg || desktopJpg || mobileWebp || desktopWebp;
  if (!finalFallback) return null;

  return (
    <picture>
      {/* Desktop first (>=1024px) */}
      {desktopWebp && (
        <source srcSet={desktopWebp} type="image/webp" media="(min-width: 1024px)" />
      )}
      {desktopJpg && (
        <source srcSet={desktopJpg} type="image/jpeg" media="(min-width: 1024px)" />
      )}

      {/* Mobile (<1024px) */}
      {mobileWebp && (
        <source srcSet={mobileWebp} type="image/webp" media="(max-width: 1023px)" />
      )}
      {mobileJpg && (
        <source srcSet={mobileJpg} type="image/jpeg" media="(max-width: 1023px)" />
      )}

      {/* Final fallback — safest universal file */}
      <img
        src={finalFallback}
        alt={alt}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </picture>
  );
}
