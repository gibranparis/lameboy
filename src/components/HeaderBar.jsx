'use client';

import dynamic from 'next/dynamic';
import DayNightToggle from './DayNightToggle';
import CartButton from './CartButton';

const BlueOrbCross3D = dynamic(() => import('./BlueOrbCross3D'), { ssr: false });

/**
 * One place to tune sizes:
 * - CONTROL: the row height and orb canvas box (px)
 * - ORB_GEOM_SCALE: passes straight into BlueOrbCross3D (affects inner visual diameter)
 * - TOGGLE_RATIO: toggle height = CONTROL * TOGGLE_RATIO (aims to match orb's visual diameter)
 */
const CONTROL = 32;          // header control box height in px
const ORB_GEOM_SCALE = 0.58; // current inner geometry scale you’re using
const TOGGLE_RATIO = 0.72;   // 0.70–0.76 usually matches orb’s inner visual size
const TOGGLE = Math.round(CONTROL * TOGGLE_RATIO);

export default function HeaderBar() {
  return (
    <header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 120,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: 'transparent',
      }}
    >
      {/* Left: orb (box is CONTROL; inner visual set by geomScale) */}
      <div style={{ height: CONTROL, display: 'grid', placeItems: 'start' }}>
        <div data-orb="density" style={{ width: CONTROL, height: CONTROL, lineHeight: 0 }}>
          <BlueOrbCross3D
            height={`${CONTROL}px`}
            geomScale={ORB_GEOM_SCALE}
            glow
            glowOpacity={0.95}
          />
        </div>
      </div>

      {/* Center: toggle sized to match orb inner geometry */}
      <div style={{ height: CONTROL, display: 'grid', placeItems: 'center' }}>
        <DayNightToggle size={TOGGLE} />
      </div>

      {/* Right: cart aligned to the same row height */}
      <div style={{ height: CONTROL, display: 'grid', placeItems: 'end' }}>
        <CartButton inHeader />
      </div>
    </header>
  );
}
