'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';
import CartCount from './CartCount';
import { useCartUI } from '@/contexts/CartUIContext';

export default function Header() {
  const [openMenu, setOpenMenu] = useState(false);
  const { openCart, open, closeCart } = useCartUI();

  // lock body scroll when overlays open
  useEffect(() => {
    const anyOpen = openMenu || open;
    const prev = document.body.style.overflow;
    document.body.style.overflow = anyOpen ? 'hidden' : prev || '';
    return () => { document.body.style.overflow = prev; };
  }, [openMenu, open]);

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>LAMEBOY</Link>

      {/* Desktop nav */}
      <nav className={styles.navDesktop}>
        <Link href="/shop">Shop</Link>
        <button
          type="button"
          className={styles.cartLink}
          onClick={openCart}
        >
          Cart
          <CartCount className={styles.badge} />
        </button>
      </nav>

      {/* Hamburger (mobile) */}
      <button
        className={styles.hamburger}
        aria-label="Open menu"
        aria-expanded={openMenu}
        aria-controls="mobile-drawer"
        onClick={() => setOpenMenu(true)}
      >
        <span /><span /><span />
      </button>

      {/* Site menu backdrop */}
      <div
        className={`${styles.backdrop} ${openMenu ? styles.show : ''}`}
        onClick={() => setOpenMenu(false)}
      />

      {/* Site drawer (mobile) */}
      <aside
        id="mobile-drawer"
        className={`${styles.drawer} ${openMenu ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Menu</span>
          <button className={styles.close} aria-label="Close menu" onClick={() => setOpenMenu(false)}>×</button>
        </div>

        <nav className={styles.navMobile}>
          <Link href="/shop" onClick={() => setOpenMenu(false)}>Shop</Link>

          {/* Mobile cart trigger */}
          <button
            type="button"
            className={`${styles.cartTrigger} ${styles.cartLink}`}
            onClick={() => {
              setOpenMenu(false);
              openCart();
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
