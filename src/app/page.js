// src/app/page.js
'use client';

import { useEffect } from 'react';
import BannedLogin from '@/components/BannedLogin';

export default function HomePage() {
  // Optional: header clean-up in plain JS (no TS casts)
  useEffect(() => {
    // Only run in the browser
    if (typeof document === 'undefined') return;

    const isShop = false; // home page
    const header = document.querySelector('header, [role="banner"], .topbar, .navbar');

    if (header) {
      // Hide any canvases/spinners/orb-like elements that might bleed in
      header
        .querySelectorAll(
          'canvas,[data-orb],[aria-label*="orb"],svg[aria-label*="spinner"],svg[aria-label*="logo"]'
        )
        .forEach((el) => {
          if (el && el.style) el.style.display = 'none';
        });

      // Make header transparent on the home page as well (defensive)
      if (header.style) {
        header.style.background = 'transparent';
        header.style.boxShadow = 'none';
        header.style.border = '0';
      }
    }

    // Make sure the global 3D background (if any) is visible on home
    // (we only force-hide it on /shop via CSS :has([data-shop-root]))
    const globalLogo = document.querySelector('.logo-3d');
    if (globalLogo && !isShop) {
      globalLogo.style.removeProperty('display');
    }
  }, []);

  return <BannedLogin />;
}
