'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export default function CartButton({ inHeader=false }){
  const [qty, setQty] = useState(0);
  const [bump, setBump] = useState(false);

  // random Birkin image each mount
  const src = useMemo(()=>{
    const bags = ['/cart/birkin-1.png','/cart/birkin-2.png','/cart/birkin-3.png','/cart/birkin-4.png'];
    return bags[Math.floor(Math.random()*bags.length)];
  },[]);

  useEffect(()=>{
    const onAdd = ()=> {
      setQty(q=>q+1);
      setBump(true);
      setTimeout(()=>setBump(false), 350);
    };
    window.addEventListener('lb:add-to-cart', onAdd);
    document.addEventListener('lb:add-to-cart', onAdd);
    return ()=> {
      window.removeEventListener('lb:add-to-cart', onAdd);
      document.removeEventListener('lb:add-to-cart', onAdd);
    };
  },[]);

  return (
    <button className={`cart-fab ${bump?'bump':''}`} aria-label="Cart">
      <span className="cart-img-wrap" aria-hidden>
        <img src={src} alt="" />
      </span>
      {qty>0 && <span className="cart-badge">{qty}</span>}
      <style jsx>{`
        .cart-fab{ position:relative; display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; padding:0; border:0; background:transparent; cursor:pointer; transform:translateZ(0); }
        .cart-fab.bump{ animation:cart-bump 350ms ease; }
        @keyframes cart-bump{ 0%{transform:scale(1)} 30%{transform:scale(1.08)} 100%{transform:scale(1)} }
        .cart-img-wrap{ display:inline-block; width:100%; height:100%; line-height:0; }
        .cart-img-wrap img{ width:100%; height:100%; object-fit:contain; pointer-events:none; }
        .cart-badge{ position:absolute; top:-6px; right:-6px; min-width:18px; height:18px; padding:0 5px; border-radius:999px; font-size:11px; line-height:18px; text-align:center; color:#000; background:#0bf05f; box-shadow:0 0 0 1px rgba(0,0,0,.25); }
      `}</style>
    </button>
  );
}
