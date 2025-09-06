// src/components/Header.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import CartCount from './CartCount';
import { useCartUI } from '@/contexts/CartUIContext';

export default function Header() {
  const [openMenu, setOpenMenu] = useState(false);
  const { openCart, open } = useCartUI(); // open = cart flyout state

  // Lock body scroll when any overlay is open
  useEffect(() => {
    const anyOpen = openMenu || open;
    const prev = document.body.style.overflow;
    document.body.style.overflow = anyOpen ? 'hidden' : prev;
    return () => { document.body.style.overflow = prev; };
  }, [openMenu, open]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} onClick={() => setOpenMenu(false)}>
          LAMEBOY
        </Link>

        <nav className={styles.nav}>
          <Link href="/shop" className={styles.link}>Shop</Link>
          <Link href="/cart" className={styles.link}>Cart</Link>
          <button
            className={styles.cartBtn}
            onClick={() => openCart()}
            aria-label="Open cart"
          >
            <span>Open Cart</span>
            <CartCount className={styles.badge} />
          </button>
          <button
            className={styles.menuBtn}
            onClick={() => setOpenMenu((v) => !v)}
            aria-expanded={openMenu}
            aria-controls="mobile-nav"
          >
            ☰
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      <aside
        id="mobile-nav"
        aria-hidden={!openMenu}
        className={openMenu ? styles.mobileOpen : styles.mobile}
      >
        <nav className={styles.mobileNav}>
          <Link href="/shop" onClick={() => setOpenMenu(false)}>Shop</Link>
          <Link href="/cart" onClick={() => setOpenMenu(false)}>Cart</Link>
          <button
            onClick={() => {
              setOpenMenu(false);
              openCart();
              try { window.dispatchEvent(new Event('menu:close')); } catch {}
            }}
          >
            <span>Open Cart</span>
            <CartCount className={styles.badge} />
          </button>
        </nav>
      </aside>
    </header>
  );
}
