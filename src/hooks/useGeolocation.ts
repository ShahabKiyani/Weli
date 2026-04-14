import { useCallback, useState } from 'react'

const GEO_CACHE_KEY = 'weli_geo_cache'

interface CachedPosition {
  lat: number
  lng: number
  timestamp: number
}

// Position cache expires after 30 minutes — stale coords are still better than nothing
const CACHE_TTL_MS = 30 * 60 * 1000

function readCache(): CachedPosition | null {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY)
    if (!raw) return null
    const parsed: CachedPosition = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(GEO_CACHE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeCache(lat: number, lng: number) {
  try {
    const entry: CachedPosition = { lat, lng, timestamp: Date.now() }
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(entry))
  } catch {
    // localStorage may be unavailable (private mode, storage full)
  }
}

function clearCache() {
  try {
    localStorage.removeItem(GEO_CACHE_KEY)
  } catch {
    // ignore
  }
}

interface GeolocationState {
  lat: number | null
  lng: number | null
  loading: boolean
  error: string | null
  denied: boolean
}

export interface UseGeolocationReturn extends GeolocationState {
  request: () => void
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>(() => {
    // Restore a previously-approved position so the map/sort work immediately
    const cached = readCache()
    if (cached) {
      return { lat: cached.lat, lng: cached.lng, loading: false, error: null, denied: false }
    }
    return { lat: null, lng: null, loading: false, error: null, denied: false }
  })

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, denied: true, error: 'Geolocation is not supported' }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        writeCache(lat, lng)
        setState({ lat, lng, loading: false, error: null, denied: false })
      },
      (err) => {
        if (err.code === 1) clearCache() // user explicitly denied — forget cached position
        setState({
          lat: null,
          lng: null,
          loading: false,
          error: err.message,
          denied: err.code === 1,
        })
      },
    )
  }, [])

  return { ...state, request }
}
