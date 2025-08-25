'use client';
import { useEffect, useRef, useState } from 'react';

export default function FullscreenLightbox({ src, naturalW, naturalH, onClose, onPrev, onNext }) {
  const wrap = useRef(null);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const startRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const pinchRef = useRef(null);

  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') onClose?.(); if (e.key === 'ArrowLeft') onPrev?.(); if (e.key === 'ArrowRight') onNext?.(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

  function onWheel(e){
    e.preventDefault();
    const rect = wrap.current.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const next = clamp(scale + (e.deltaY < 0 ? 0.2 : -0.2), 1, 6);
    const k = next / scale;
    const nx = (pos.x - cx) * k + cx, ny = (pos.y - cy) * k + cy;
    setScale(next); setPos({ x: nx, y: ny }); posRef.current = { x: nx, y: ny };
  }

  function onDown(e){ e.preventDefault(); setDragging(true); startRef.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y }; }
  function onMove(e){ if(!dragging) return; const nx = e.clientX - startRef.current.x, ny = e.clientY - startRef.current.y; setPos({x:nx,y:ny}); posRef.current={x:nx,y:ny}; }
  function onUp(){ setDragging(false); }

  const center = (t1,t2)=>({ x:(t1.clientX+t2.clientX)/2, y:(t1.clientY+t2.clientY)/2 });
  const dist = (t1,t2)=>Math.hypot(t1.clientX-t2.clientX, t1.clientY-t2.clientY);

  function onTouchStart(e){
    if (e.touches.length === 2){
      const [t1,t2]=e.touches, rect=wrap.current.getBoundingClientRect(), c=center(t1,t2);
      pinchRef.current={ dist:dist(t1,t2), scaleStart:scale, cx:c.x-rect.left, cy:c.y-rect.top };
    } else if (e.touches.length === 1){
      const t=e.touches[0]; setDragging(true); startRef.current={ x:t.clientX-posRef.current.x, y:t.clientY-posRef.current.y };
    }
  }
  function onTouchMove(e){
    if (e.touches.length === 2 && pinchRef.current){
      e.preventDefault();
      const [t1,t2]=e.touches, rect=wrap.current.getBoundingClientRect(), d=dist(t1,t2), c=center(t1,t2), cx=c.x-rect.left, cy=c.y-rect.top;
      const next=clamp(pinchRef.current.scaleStart*(d/pinchRef.current.dist),1,6), k=next/scale, nx=(pos.x-cx)*k+cx, ny=(pos.y-cy)*k+cy;
      setScale(next); setPos({x:nx,y:ny}); posRef.current={x:nx,y:ny};
    } else if (e.touches.length === 1 && dragging){
      e.preventDefault(); const t=e.touches[0], nx=t.clientX-startRef.current.x, ny=t.clientY-startRef.current.y;
      setPos({x:nx,y:ny}); posRef.current={x:nx,y:ny};
    }
  }
  function onTouchEnd(e){ if (e.touches.length === 0){ setDragging(false); pinchRef.current=null; } }

  return (
    <div onClick={(e)=>{ if(e.target===e.currentTarget) onClose?.(); }}
         style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.9)', zIndex:1000, display:'grid', placeItems:'center', cursor: dragging?'grabbing':'default' }}>
      <div ref={wrap}
           onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
           onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}
           style={{ width:'min(95vw,1600px)', height:'min(90vh,1000px)', position:'relative', overflow:'hidden', touchAction:'none' }}>
        <img src={src} alt="" draggable={false}
             style={{ position:'absolute', left:0, top:0, transform:`translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                      transformOrigin:'0 0', maxWidth:'none', width: naturalW? naturalW+'px':'auto', userSelect:'none' }} />
      </div>
      <div style={{ position:'fixed', top:16, right:16, display:'flex', gap:8 }}>
        <button className="btn" onClick={()=>setScale(s=>Math.max(1,s-0.2))}>−</button>
        <button className="btn" onClick={()=>setScale(s=>Math.min(6,s+0.2))}>+</button>
        <button className="btn" onClick={()=>{ setScale(1); setPos({x:0,y:0}); posRef.current={x:0,y:0}; }}>Reset</button>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      {onPrev && <button aria-label="Previous" className="btn" onClick={onPrev} style={{ position:'fixed', left:16, top:'50%', transform:'translateY(-50%)' }}>‹</button>}
      {onNext && <button aria-label="Next" className="btn" onClick={onNext} style={{ position:'fixed', right:16, top:'50%', transform:'translateY(-50%)' }}>›</button>}
    </div>
  );
}
