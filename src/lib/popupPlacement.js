// src/lib/popupPlacement.js
'use client'

/**
 * Where a pop-up opens beside a control that has been dragged away from its
 * home: on the side with more room (above / below), lined up with the
 * control's nearer edge, kept on screen. Returns null while the control is
 * home, so the pop-up keeps its usual CSS spot.
 * @param {Element | null | undefined} anchor the control (or anything inside the dragged wrapper)
 * @param {{ width: number, maxHeight: number, prefer?: 'above' | 'below', gap?: number, edge?: number }} o
 * @returns {null | Record<string, string | number>} inline style for a position: fixed pop-up
 */
export function placeNear(anchor, { width, maxHeight, prefer = 'below', gap = 10, edge = 12 }) {
  if (!anchor || !anchor.closest('[style*="translate"]')) return null
  const r = anchor.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = Math.min(width, vw - 2 * edge)
  const roomBelow = vh - r.bottom - gap - edge
  const roomAbove = r.top - gap - edge
  const enough = Math.min(maxHeight, 240)
  const below =
    prefer === 'below'
      ? roomBelow >= enough || roomBelow >= roomAbove
      : !(roomAbove >= enough || roomAbove >= roomBelow)
  const onRight = r.left + r.width / 2 > vw / 2
  const left = Math.max(edge, Math.min(vw - edge - w, onRight ? r.right - w : r.left))
  return {
    left,
    right: 'auto',
    width: w,
    maxHeight: Math.max(160, Math.min(maxHeight, below ? roomBelow : roomAbove)),
    ...(below ? { top: r.bottom + gap, bottom: 'auto' } : { bottom: vh - r.top + gap, top: 'auto' }),
    transformOrigin: `${below ? 'top' : 'bottom'} ${onRight ? 'right' : 'left'}`,
  }
}
