// src/components/orb/WhiteLoader.jsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import nextDynamic from 'next/dynamic'

const BlueOrbCross3D = nextDynamic(() => import('@/components/BlueOrbCross3D'), { ssr: false })

const WHITE_Z = 10002
const FADE_OUT_MS = 260

function ClockNaples() {
  const [now, setNow] = useState('')
  useEffect(() => {
    const fmt = () =>
      setNow(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        }).format(new Date())
      )
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [])
  return <span>{now}</span>
}

export default function WhiteLoader({ show }) {
  // We mount instantly (no fade-in) and only fade OUT on hide.
  const [mounted, setMounted] = useState(!!show)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const hideTimer = useRef(null)

  useEffect(() => {
    if (show) {
      // Cancel any pending unmount and show immediately at full opacity.
      if (hideTimer.current) clearTimeout(hideTimer.current)
      setMounted(true)
      setIsFadingOut(false)
      return
    }

    // show === false: fade out then unmount
    if (mounted && !isFadingOut) {
      setIsFadingOut(true)
      hideTimer.current = setTimeout(() => {
        setMounted(false)
        setIsFadingOut(false)
      }, FADE_OUT_MS)
    }

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [show, mounted, isFadingOut])

  if (!mounted) return null

  const opacity = isFadingOut ? 0 : 1

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: WHITE_Z,
        pointerEvents: 'none',
        background: '#fff',
        display: 'grid',
        placeItems: 'center',
        opacity,
        transition: isFadingOut ? `opacity ${FADE_OUT_MS}ms ease` : 'none', // IMPORTANT: no fade-in
        contain: 'layout paint style',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ lineHeight: 0 }}>
          <BlueOrbCross3D
            rpm={44}
            color="#32ffc7"
            geomScale={1.12}
            glow
            glowOpacity={1}
            includeZAxis
            height="88px"
            interactive={false}
            // Black core, SEAFOAM glow
            overrideAllColor="#000"
            haloTint="#32ffc7"
            // keep any “flash” behavior out of the loader
            flashDecayMs={0}
            solidOverride
          />
        </div>

        <span
          style={{
            color: '#000',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            lineHeight: 1.2,
          }}
        >
          <ClockNaples />
        </span>

        <span
          style={{
            color: '#000',
            fontWeight: 800,
            letterSpacing: '.06em',
            fontSize: 'clamp(12px,1.3vw,14px)',
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          LAMEBOY, USA
        </span>
      </div>
    </div>
  )
}
