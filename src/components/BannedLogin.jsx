// src/components/BannedLogin.jsx
'use client'

import { useEffect, useLayoutEffect, useMemo, useState, useRef, useCallback } from 'react'

export default function BannedLogin({
  onAdvanceGate,
  onProceed,
  gateStep = 0,
  isProceeding = false,
  videoRevealed = false,
  orbHeld = false, // the orb is being dragged (or springing home)
}) {
  const [now, setNow] = useState(() => new Date())
  const [visitorLocation, setVisitorLocation] = useState('Cape Coral, USA') // Visitor's actual location
  const [visitorRegion, setVisitorRegion] = useState(null) // raw region/state from IP
  const [visitorTimezone, setVisitorTimezone] = useState(null) // Visitor's actual timezone

  // IMPORTANT: while this gate is mounted, hide any "global/header" orb duplicates
  useEffect(() => {
    document.documentElement.setAttribute('data-gate-open', '1')
    return () => {
      document.documentElement.removeAttribute('data-gate-open')
    }
  }, [])

  // Fetch user's location and timezone from IP (only once)
  useEffect(() => {
    async function fetchLocation() {
      try {
        const response = await fetch('https://ipapi.co/json/')
        const data = await response.json()
        
        // Use region (state) instead of city for broader location
        if (data.region) setVisitorRegion(data.region)
        if (data.region && data.country_code) {
          const countryCode = data.country_code === 'US' ? 'USA' : data.country_code
          setVisitorLocation(`${data.region}, ${countryCode}`)
        } else if (data.city && data.country_code) {
          const countryCode = data.country_code === 'US' ? 'USA' : data.country_code
          setVisitorLocation(`${data.city}, ${countryCode}`)
        }
        
        if (data.timezone) {
          setVisitorTimezone(data.timezone)
        }
      } catch (error) {
        console.log('Location detection failed, using default')
      }
    }

    fetchLocation()
  }, [])

  useEffect(() => {
    const tick = () => setNow(new Date())
    // Align to next second boundary so the display ticks at :00 ms
    const msToNextSec = 1000 - (Date.now() % 1000)
    let intervalId
    const alignTimer = setTimeout(() => {
      tick()
      intervalId = setInterval(tick, 1000)
    }, msToNextSec)
    return () => {
      clearTimeout(alignTimer)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  // "pull me" hint over the orb: pops up 6s after the splash opens, stays
  // 3s. Skipped once the orb has been touched.
  const [hintUp, setHintUp] = useState(false)
  const orbTouched = gateStep > 0 || isProceeding || orbHeld
  useEffect(() => {
    if (orbTouched) {
      setHintUp(false)
      return
    }
    const show = setTimeout(() => setHintUp(true), 6000)
    const hide = setTimeout(() => setHintUp(false), 9000)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [orbTouched])

  // Determine which location and timezone to show based on gateStep
  const displayLocation = useMemo(() => {
    if (isProceeding) return 'Let All Mankind Evolve'
    if (gateStep === 0) return 'Lameboy, USA'
    // Right after the orb is pressed, bring "Lameboy, USA" straight back
    // instead of jumping to the visitor's location
    if (gateStep === 1) return 'Lameboy, USA'
    if (gateStep === 2) return 'Naples, USA'
    if (gateStep === 3) return 'Florida, USA'
    return visitorLocation
  }, [gateStep, visitorLocation, isProceeding])

  const displayTimezone = useMemo(() => {
    // Always use Eastern Time during gate sequence
    return gateStep >= 1 ? 'America/New_York' : visitorTimezone
  }, [gateStep, visitorTimezone])

  const clockText = useMemo(() => {
    const options = {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }
    
    if (displayTimezone) {
      options.timeZone = displayTimezone
    }
    
    return now.toLocaleTimeString([], options)
  }, [now, displayTimezone])

  // Long-press handling on text (optional parity with orb)
  const pressTimer = useRef(null)
  const startPressTimer = useCallback(() => {
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => {
      if (typeof onProceed === 'function') onProceed()
    }, 650)
  }, [onProceed])

  const clearPressTimer = useCallback(() => clearTimeout(pressTimer.current), [])

  const advanceGate = useCallback(() => {
    if (typeof onAdvanceGate === 'function') onAdvanceGate()
  }, [onAdvanceGate])

  const triggerProceed = useCallback(() => {
    if (typeof onProceed === 'function') onProceed()
  }, [onProceed])

  // While the orb is dragged away, the time + location glide up into the
  // middle it left; once it's home they bounce back under it. Web
  // Animations, because the gate turns CSS transitions off (globals.css).
  const labelRef = useRef(/** @type {HTMLDivElement|null} */ (null))
  const labelAnim = useRef(/** @type {Animation|null} */ (null))
  const firstLabelRun = useRef(true)
  useLayoutEffect(() => {
    const el = labelRef.current
    if (!el) return
    if (firstLabelRun.current) { firstLabelRun.current = false; if (!orbHeld) return }
    // Start from wherever it is now, even mid-bounce
    const from = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42
    labelAnim.current?.cancel()
    const r = el.getBoundingClientRect()
    const vh = window.visualViewport?.height ?? window.innerHeight
    const to = orbHeld ? vh / 2 - (r.top + r.height / 2 - from) : 0
    el.style.transform = `translateY(${to}px)`
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    labelAnim.current = el.animate(
      [{ transform: `translateY(${from}px)` }, { transform: `translateY(${to}px)` }],
      orbHeld
        ? { duration: 400, easing: 'cubic-bezier(0.2, 0.9, 0.2, 1)' } // quick glide up
        : { duration: 650, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' } // springs past its spot
    )
  }, [orbHeld])

  return (
    <div
      onClick={advanceGate}
      onMouseDown={startPressTimer}
      onMouseUp={clearPressTimer}
      onMouseLeave={clearPressTimer}
      onTouchStart={startPressTimer}
      onTouchEnd={clearPressTimer}
      onDoubleClick={triggerProceed}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: videoRevealed ? 'transparent' : '#fff',
        zIndex: 10010,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div
        ref={labelRef}
        style={{
          marginTop: 150,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
      {/* Time */}
      <span
        style={{
          textAlign: 'center',
          fontSize: 'clamp(12px, 1.2vw, 14px)',
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: videoRevealed ? '#fff' : '#000',
          opacity: 0.95,
          textTransform: 'uppercase',
          lineHeight: 1.2,
          textShadow: videoRevealed
            ? '0 1px 4px rgba(0,0,0,0.55), 0 0 12px rgba(0,0,0,0.35)'
            : 'none',
        }}
      >
        {clockText}
      </span>

      {/* Dynamic location — hidden once the text goes white and the orb
          hasn't been pressed yet (idle wallpaper view), reappears the
          moment the orb is triggered */}
      {!(videoRevealed && gateStep === 0) && (
        <span
          style={{
            marginTop: 6,
            textAlign: 'center',
            fontSize: 'clamp(12px, 1.2vw, 14px)',
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: videoRevealed ? '#fff' : '#000',
            opacity: 0.95,
            textTransform: 'uppercase',
            lineHeight: 1.2,
            textShadow: videoRevealed
              ? '0 1px 4px rgba(0,0,0,0.55), 0 0 12px rgba(0,0,0,0.35)'
              : 'none',
          }}
        >
          {displayLocation}
        </span>
      )}
      </div>

      {hintUp && (
        <div className="lb-pull-hint" aria-live="polite" data-video={videoRevealed ? '1' : '0'}>
          <span className="lb-pull-sparkle lb-pull-sparkle--l" aria-hidden="true">✦</span>
          pull me <span className="lb-pull-heart" aria-hidden="true">♡</span>
          <span className="lb-pull-sparkle lb-pull-sparkle--r" aria-hidden="true">✧</span>
        </div>
      )}
      <style jsx>{`
        /* soft pastel bubble: pink to lilac, a beating heart and twinkles */
        .lb-pull-hint {
          position: fixed;
          left: 50%;
          top: calc(50% - 50px);
          transform: translate(-50%, -100%);
          padding: 7px 16px 8px;
          border-radius: 999px;
          background: linear-gradient(135deg, #ffd6ea 0%, #f6d3ff 55%, #dcd6ff 100%);
          border: 1.5px solid #fff;
          color: #d63f8c;
          /* same type as the clock and location below */
          font-family: inherit;
          font-size: clamp(12px, 1.2vw, 14px);
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          line-height: 1.2;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 6px 18px rgba(232, 120, 190, 0.35), 0 1px 0 rgba(255, 255, 255, 0.9) inset;
          animation: lbHintIn 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) both,
            lbHintBob 1.4s ease-in-out 0.45s infinite,
            lbHintOut 0.35s ease-in 2.65s forwards;
        }
        .lb-pull-hint::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: -6px;
          width: 11px;
          height: 11px;
          background: #f6d3ff;
          border-right: 1.5px solid #fff;
          border-bottom: 1.5px solid #fff;
          border-radius: 0 0 3px 0;
          transform: translateX(-50%) rotate(45deg);
        }
        .lb-pull-hint[data-video='1'] {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        .lb-pull-heart {
          display: inline-block;
          margin-left: 2px;
          color: #ff5fa8;
          animation: lbHintHeart 0.9s ease-in-out infinite;
        }
        .lb-pull-sparkle {
          position: absolute;
          font-size: 11px;
          line-height: 1;
          color: #c99bff;
          animation: lbHintTwinkle 1.2s ease-in-out infinite;
        }
        .lb-pull-sparkle--l { left: -9px; top: -6px; }
        .lb-pull-sparkle--r { right: -8px; bottom: -4px; color: #ff8cc6; animation-delay: 0.6s; }
        @keyframes lbHintIn {
          from { opacity: 0; transform: translate(-50%, -70%) scale(0.5); }
          to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        }
        @keyframes lbHintBob {
          0%, 100% { margin-top: 0; }
          50% { margin-top: -5px; }
        }
        @keyframes lbHintHeart {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.3); }
          50% { transform: scale(1.05); }
        }
        @keyframes lbHintTwinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.7) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.15) rotate(20deg); }
        }
        @keyframes lbHintOut {
          to { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lb-pull-hint { animation: lbHintOut 0.35s ease-in 2.65s forwards; }
          .lb-pull-heart, .lb-pull-sparkle { animation: none; }
        }
      `}</style>
    </div>
  )
}
