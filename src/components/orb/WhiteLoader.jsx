// src/components/orb/WhiteLoader.jsx
'use client'

import React, { useEffect, useState } from 'react'

const WHITE_Z = 10002

export default function WhiteLoader({ show }) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (!show && visible) {
      const t = setTimeout(() => setVisible(false), 260)
      return () => clearTimeout(t)
    }
    if (show && !visible) setVisible(true)
  }, [show, visible])

  if (!visible) return null

  const opacity = show ? 1 : 0

  return (
    <div
      aria-hidden
      className="white-loader"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: WHITE_Z,
        pointerEvents: 'none',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'opacity 260ms ease',
        opacity,
        contain: 'layout paint style',
      }}
    />
  )
}
