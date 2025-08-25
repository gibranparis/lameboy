'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function ZoomImage({ src, zoomSrc, alt = '', width, height, lens = 220 }) {
  const wrapRef = useRef(null);
  const [show, setShow] = useState(false);
  const [pos, setPos]   = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const img = new window.Image();
    img.src = zoomSrc || src;
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  }, [src, zoomSrc]);

  function onMove(e) {
    const rect = wrapRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
    setPos({ x, y });
  }

  const bgSize = natural.w && natural.h ? `${natural.w}px ${natural.h}px` : `${width}px ${height}px`;
  const bgPos  = natural.w && natural.h
    ? `-${(pos.x / width) * natural.w - lens / 2}px -${(pos.y / height) * natural.h - lens / 2}px`
    : `-${pos.x - lens / 2}px -${pos.y - lens / 2}px`;

  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onMouseMove={onMove}
      style={{ position: 'relative', width, height }}
      className="card"
    >
      <Image src={src} alt={alt} width={width} height={height} sizes="(max-width: 768px) 100vw, 60vw" priority />
      {show && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: lens, height: lens,
            top: pos.y - lens / 2, left: pos.x - lens / 2,
            pointerEvents: 'none', borderRadius: '9999px',
            boxShadow: '0 0 0 1px rgba(255,255,255,.2), 0 10px 30px rgba(0,0,0,.5)',
            backgroundImage: `url(${zoomSrc || src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: bgSize,
            backgroundPosition: bgPos
          }}
        />
      )}
    </div>
  );
}
