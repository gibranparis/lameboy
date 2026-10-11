// src/lib/profile.js
// Device-only customer "login": the contact + shipping details a customer
// gave us (via the heart's join form or a completed checkout), kept in this
// browser's localStorage so checkout can prefill. No passwords, nothing
// server-side, nothing card-related — Stripe Link handles saved cards.
'use client'

import { useEffect, useState } from 'react'

const KEY = 'lb:profile'
// Older keys folded into lb:profile on first read. Earlier entries win.
const LEGACY_KEYS = ['lb:checkout', 'lb:lead']
export const PROFILE_EVENT = 'lb:profile-change'

export const PROFILE_FIELDS = ['name', 'email', 'phone', 'address1', 'address2', 'city', 'state', 'zip', 'country']

function pick(obj) {
  const out = {}
  if (!obj || typeof obj !== 'object') return out
  for (const f of PROFILE_FIELDS) {
    if (obj[f] != null) out[f] = String(obj[f])
  }
  return out
}

function readKey(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

let migrated = false

/** Fold lb:checkout / lb:lead into lb:profile once, then delete them. */
function migrate() {
  if (migrated) return
  migrated = true
  try {
    const profile = pick(readKey(KEY))
    let changed = false
    for (const key of LEGACY_KEYS) {
      const legacy = readKey(key)
      if (legacy == null) continue
      for (const [f, v] of Object.entries(pick(legacy))) {
        if (v && !profile[f]) {
          profile[f] = v
          changed = true
        }
      }
      localStorage.removeItem(key)
    }
    if (changed) localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {}
}

function notify() {
  try {
    window.dispatchEvent(new Event(PROFILE_EVENT))
  } catch {}
}

/** The saved profile, or null if there isn't one. */
export function getProfile() {
  if (typeof window === 'undefined') return null
  migrate()
  const profile = pick(readKey(KEY))
  return Object.keys(profile).length ? profile : null
}

/** Merge `partial` into the saved profile. Undefined fields are left alone. */
export function saveProfile(partial) {
  if (typeof window === 'undefined') return
  try {
    const next = { ...(getProfile() ?? {}), ...pick(partial) }
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
  notify()
}

/** Forget this device's profile ("sign out"). */
export function clearProfile() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY)
    for (const key of LEGACY_KEYS) localStorage.removeItem(key)
  } catch {}
  notify()
}

/** A customer counts as signed in once they've given us an email. */
export function isSignedIn(profile) {
  return Boolean(profile?.email)
}

/** Live profile: updates on save/clear in this tab and in other tabs. */
export function useProfile() {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    const refresh = () => setProfile(getProfile())
    const onStorage = (e) => {
      if (e.key == null || e.key === KEY) refresh()
    }
    refresh()
    window.addEventListener(PROFILE_EVENT, refresh)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(PROFILE_EVENT, refresh)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return profile
}
