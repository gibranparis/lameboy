// src/components/BannedLogin.jsx
'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'

export default function BannedLogin({ onAdvanceGate, onProceed, gateStep = 0, isProceeding = false }) {
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

  // Determine which location and timezone to show based on gateStep
  const displayLocation = useMemo(() => {
    if (isProceeding) return 'Let All Mankind Evolve'
    if (gateStep === 0) return 'Lameboy, USA'
    if (gateStep === 1) return visitorRegion?.toLowerCase() === 'florida' ? 'Cape Coral, USA' : visitorLocation
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#fff',
        zIndex: 10010,
      }}
    >
      {/* Time */}
      <button
        type="button"
        onClick={advanceGate}
        onMouseDown={startPressTimer}
        onMouseUp={clearPressTimer}
        onMouseLeave={clearPressTimer}
        onTouchStart={startPressTimer}
        onTouchEnd={clearPressTimer}
        onDoubleClick={triggerProceed}
        style={{
          marginTop: 150,
          textAlign: 'center',
          fontSize: 'clamp(12px, 1.2vw, 14px)',
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: '#000',
          opacity: 0.9,
          textTransform: 'uppercase',
          lineHeight: 1.2,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {clockText}
      </button>

      {/* Dynamic location */}
      <button
        type="button"
        onClick={advanceGate}
        onMouseDown={startPressTimer}
        onMouseUp={clearPressTimer}
        onMouseLeave={clearPressTimer}
        onTouchStart={startPressTimer}
        onTouchEnd={clearPressTimer}
        onDoubleClick={triggerProceed}
        style={{
          marginTop: 6,
          textAlign: 'center',
          fontSize: 'clamp(12px, 1.2vw, 14px)',
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: '#000',
          opacity: 0.9,
          textTransform: 'uppercase',
          cursor: 'pointer',
          userSelect: 'none',
          outline: 'none',
          lineHeight: 1.2,
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
      >
        {displayLocation}
      </button>
    </div>
  )
}
