import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGeolocation } from '@/hooks/useGeolocation'

const mockGetCurrentPosition = vi.fn()

beforeEach(() => {
  mockGetCurrentPosition.mockReset()
  Object.defineProperty(global.navigator, 'geolocation', {
    value: { getCurrentPosition: mockGetCurrentPosition },
    configurable: true,
    writable: true,
  })
})

describe('useGeolocation', () => {
  it('starts with idle state — no coordinates, not loading, not denied', () => {
    const { result } = renderHook(() => useGeolocation())
    expect(result.current.lat).toBeNull()
    expect(result.current.lng).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.denied).toBe(false)
  })

  it('sets loading=true after request() is called before the OS responds', () => {
    mockGetCurrentPosition.mockImplementation(() => {
      // never calls back — simulates pending
    })
    const { result } = renderHook(() => useGeolocation())
    act(() => result.current.request())
    expect(result.current.loading).toBe(true)
  })

  it('returns coordinates and clears loading on success', () => {
    mockGetCurrentPosition.mockImplementation((success: (p: unknown) => void) => {
      success({ coords: { latitude: 42.37, longitude: -72.52 } })
    })
    const { result } = renderHook(() => useGeolocation())
    act(() => result.current.request())
    expect(result.current.lat).toBeCloseTo(42.37)
    expect(result.current.lng).toBeCloseTo(-72.52)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets denied=true on PERMISSION_DENIED error (code 1)', () => {
    mockGetCurrentPosition.mockImplementation((_: unknown, error: (e: unknown) => void) => {
      error({ code: 1, message: 'User denied geolocation' })
    })
    const { result } = renderHook(() => useGeolocation())
    act(() => result.current.request())
    expect(result.current.denied).toBe(true)
    expect(result.current.loading).toBe(false)
    expect(result.current.lat).toBeNull()
  })

  it('sets error message on non-permission error', () => {
    mockGetCurrentPosition.mockImplementation((_: unknown, error: (e: unknown) => void) => {
      error({ code: 2, message: 'Position unavailable' })
    })
    const { result } = renderHook(() => useGeolocation())
    act(() => result.current.request())
    expect(result.current.error).toBe('Position unavailable')
    expect(result.current.denied).toBe(false)
  })

  it('sets denied=true immediately when geolocation API is unavailable', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
      writable: true,
    })
    const { result } = renderHook(() => useGeolocation())
    act(() => result.current.request())
    expect(result.current.denied).toBe(true)
  })
})
