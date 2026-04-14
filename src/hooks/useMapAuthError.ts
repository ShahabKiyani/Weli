import { useSyncExternalStore } from 'react'

/**
 * Google calls `window.gm_authFailure()` when a Maps JavaScript API key
 * fails authentication (invalid key, billing disabled, referrer mismatch).
 *
 * This hook subscribes to that global callback and returns `true` when
 * an auth failure has been detected — letting map components switch to
 * a graceful fallback instead of rendering the Google error dialog.
 */

let authFailed = false
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return authFailed
}

// Install the global callback once (idempotent)
if (typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>
  if (!w.__weli_gm_auth_installed) {
    w.__weli_gm_auth_installed = true
    w.gm_authFailure = () => {
      authFailed = true
      listeners.forEach((cb) => cb())
    }
  }
}

export function useMapAuthError(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
