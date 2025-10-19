'use client';

import { useEffect, useMemo, useState } from 'react';

export default function CartButton(){
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
    </button>
  );
}
