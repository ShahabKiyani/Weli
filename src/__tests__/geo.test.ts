import { describe, it, expect } from 'vitest'
import { haversineKm, formatDistance } from '@/lib/geo'

describe('haversineKm', () => {
  it('returns ~0 for identical points', () => {
    expect(haversineKm(42.3732, -72.5199, 42.3732, -72.5199)).toBeCloseTo(0, 3)
  })

  it('calculates ~1 km for ~0.009 degree latitude difference', () => {
    // 1 degree lat ≈ 111 km, so 0.009° ≈ 1 km
    const d = haversineKm(42.3732, -72.5199, 42.3822, -72.5199)
    expect(d).toBeGreaterThan(0.8)
    expect(d).toBeLessThan(1.2)
  })

  it('is symmetric — A→B equals B→A', () => {
    const d1 = haversineKm(42.37, -72.52, 42.39, -72.50)
    const d2 = haversineKm(42.39, -72.50, 42.37, -72.52)
    expect(d1).toBeCloseTo(d2, 5)
  })

  it('returns a positive value for distinct points', () => {
    expect(haversineKm(42.0, -72.0, 43.0, -73.0)).toBeGreaterThan(0)
  })

  it('handles crossing the anti-meridian correctly (still positive)', () => {
    // Sydney to Los Angeles: large positive distance
    const d = haversineKm(-33.87, 151.21, 34.05, -118.24)
    expect(d).toBeGreaterThan(10000)
  })
})

describe('formatDistance', () => {
  it('returns "—" for undefined', () => {
    expect(formatDistance(undefined)).toBe('—')
  })

  it('formats sub-kilometre distances as metres', () => {
    expect(formatDistance(0.5)).toBe('500m')
  })

  it('rounds metres', () => {
    expect(formatDistance(0.256)).toBe('256m')
  })

  it('formats distances >= 1 km with one decimal', () => {
    expect(formatDistance(1.5)).toBe('1.5km')
  })

  it('formats exactly 1 km', () => {
    expect(formatDistance(1.0)).toBe('1.0km')
  })
})
