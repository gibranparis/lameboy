'use client';
import { useState } from 'react';
import Image from 'next/image';
import ZoomImage from '@/components/ZoomImage';
import FullscreenLightbox from '@/components/FullscreenLightbox';

export default function ProductGallery({ images = [], name = '' }) {
  const safe = images.filter(i => i?.url);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const active = safe[idx] || {};
  const naturalW = active.w || 1200;
  const naturalH = active.h || 1200;
  const displayW = Math.min(naturalW, 1200);
  const displayH = Math.round(displayW * (naturalH / naturalW));

  const prev = () => setIdx(i => (i - 1 + safe.length) % safe.length);
  const next = () => setIdx(i => (i + 1) % safe.length);

  return (
    <div>
      <div onClick={()=> setOpen(true)} style={{ cursor:'zoom-in' }}>
        <ZoomImage src={active.url} zoomSrc={active.url} alt={name} width={displayW} height={displayH} lens={220} />
      </div>

      {safe.length > 1 && (
        <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
          {safe.map((img, i) => (
            <button key={i} onClick={()=> setIdx(i)}
              style={{ border: i===idx ? '2px solid #fff' : '1px solid #333', borderRadius:12, padding:0, background:'transparent' }}
              aria-label={`Thumbnail ${i+1}`}>
              <Image src={img.url} alt="" width={80} height={80} />
            </button>
          ))}
        </div>
      )}

      {open && (
        <FullscreenLightbox
          src={active.url}
          naturalW={naturalW}
          naturalH={naturalH}
          onClose={()=> setOpen(false)}
          onPrev={safe.length > 1 ? prev : undefined}
          onNext={safe.length > 1 ? next : undefined}
        />
      )}
    </div>
  );
}
