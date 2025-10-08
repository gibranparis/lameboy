'use client';

import dynamic from 'next/dynamic';
import DayNightToggle from './DayNightToggle';
import CartButton from './CartButton';

const BlueOrbCross3D = dynamic(() => import('./BlueOrbCross3D'), { ssr: false });

const ROW_H = 44; // << single source of truth for header control height

export default function HeaderBar() {
  return (
    <header role="banner"
      style={{
        position:'sticky',
        top:0,
        zIndex:120,
        display:'grid',
        gridTemplateColumns:'1fr auto 1fr',
        alignItems:'center',
        gap:16,
        padding:'8px 14px',
      }}
    >
      <div style={{ height:ROW_H, display:'grid', placeItems:'start' }}>
        <div data-orb="density" style={{ width:ROW_H, height:ROW_H }}>
          <BlueOrbCross3D height={`${ROW_H}px`} geomScale={0.72} glow glowOpacity={0.95} />
        </div>
      </div>

      <div style={{ display:'grid', placeItems:'center' }}>
        <DayNightToggle height={ROW_H} />
      </div>

      <div style={{ height:ROW_H, display:'grid', placeItems:'end' }}>
        <CartButton inHeader />
      </div>
    </header>
  );
}
