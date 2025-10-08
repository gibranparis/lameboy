'use client';

import dynamic from 'next/dynamic';
import DayNightToggle from './DayNightToggle';
import CartButton from './CartButton';

const BlueOrbCross3D = dynamic(() => import('./BlueOrbCross3D'), { ssr: false });

const CONTROL = 32; // exact visual height for all three controls

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
        gap:12,
        padding:'10px 14px',
        background:'transparent',
      }}
    >
      <div style={{ height:CONTROL, display:'grid', placeItems:'start' }}>
        <div data-orb="density" style={{ width:CONTROL, height:CONTROL, lineHeight:0 }}>
          <BlueOrbCross3D height={`${CONTROL}px`} geomScale={0.58} glow glowOpacity={0.95} />
        </div>
      </div>

      <div style={{ height:CONTROL, display:'grid', placeItems:'center' }}>
        <DayNightToggle size={CONTROL} />
      </div>

      <div style={{ height:CONTROL, display:'grid', placeItems:'end' }}>
        <CartButton inHeader />
      </div>
    </header>
  );
}
