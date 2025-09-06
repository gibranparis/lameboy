// src/components/CartCount.jsx
'use client';
import { useCart } from '@/contexts/CartContext';

export default function CartCount({ className = '' }) {
  const { itemCount } = useCart();
  if (!itemCount) return null;
  return <span className={className}>{itemCount}</span>;
}
