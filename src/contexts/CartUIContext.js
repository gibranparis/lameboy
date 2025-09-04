'use client';
import React from 'react';

const CartUIContext = React.createContext({
  open: false,
  openCart: () => {},
  closeCart: () => {},
  toggleCart: () => {},
});

export function CartUIProvider({ children }) {
  const [open, setOpen] = React.useState(false);

  // Global events for convenience
  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    const onToggle = () => setOpen((v) => !v);
    window.addEventListener('cart:open', onOpen);
    window.addEventListener('cart:close', onClose);
    window.addEventListener('cart:toggle', onToggle);
    return () => {
      window.removeEventListener('cart:open', onOpen);
      window.removeEventListener('cart:close', onClose);
      window.removeEventListener('cart:toggle', onToggle);
    };
  }, []);

  // Basic scroll lock
  React.useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = open ? 'hidden' : prev || '';
    return () => { document.documentElement.style.overflow = prev; };
  }, [open]);

  const api = React.useMemo(() => ({
    open,
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
    toggleCart: () => setOpen((v) => !v),
  }), [open]);

  return <CartUIContext.Provider value={api}>{children}</CartUIContext.Provider>;
}

export function useCartUI() {
  return React.useContext(CartUIContext);
}
