import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRestaurants } from '@/hooks/useRestaurants'
import { supabase } from '@/lib/supabase'
import type { RestaurantStats } from '@/types/database.types'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

function makeRestaurant(overrides: Partial<RestaurantStats> = {}): RestaurantStats {
  return {
    id: 'r1',
    name: 'Pita Pockets',
    address: '1 Main St',
    latitude: 42.3732,
    longitude: -72.5199,
    cuisine_type: 'Mediterranean',
    description: null,
    image_url: null,
    phone: null,
    website: null,
    google_place_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    avg_score: 8.0,
    review_count: 5,
    ...overrides,
  }
}

/**
 * Creates a chain where .select() returns a thenable that also has .eq().
 * This covers both `await select('*')` (no filter) and `await select('*').eq(...)` (filtered).
 */
function makeChain(data: RestaurantStats[], error: unknown = null) {
  const result = { data, error }
  const eqMock = vi.fn().mockResolvedValue(result)
  const selectable = Object.assign(Promise.resolve(result), { eq: eqMock })
  return {
    chain: { select: vi.fn().mockReturnValue(selectable) } as never,
    eqMock,
  }
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => vi.resetAllMocks())

describe('useRestaurants', () => {
  it('fetches all restaurant stats when no cuisine filter', async () => {
    const { chain } = makeChain([makeRestaurant()])
    vi.mocked(supabase.from).mockReturnValue(chain)
    const { result } = renderHook(() => useRestaurants(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.allRestaurants).toHaveLength(1)
  })

  it('applies .eq(cuisine_type) filter when cuisine is provided', async () => {
    const { chain, eqMock } = makeChain([makeRestaurant()])
    vi.mocked(supabase.from).mockReturnValue(chain)
    const { result } = renderHook(() => useRestaurants({ cuisine: 'Mediterranean' }), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(eqMock).toHaveBeenCalledWith('cuisine_type', 'Mediterranean')
  })

  it('sorts by name (A-Z) by default', async () => {
    const restaurants = [
      makeRestaurant({ id: 'r2', name: 'Ziti Zings' }),
      makeRestaurant({ id: 'r1', name: 'Amherst Grille' }),
    ]
    const { chain } = makeChain(restaurants)
    vi.mocked(supabase.from).mockReturnValue(chain)
    const { result } = renderHook(() => useRestaurants({ sort: 'name' }), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const names = result.current.data!.allRestaurants.map((r) => r.name)
    expect(names[0]).toBe('Amherst Grille')
    expect(names[1]).toBe('Ziti Zings')
  })

  it('sorts by avg_score descending for "rating" sort', async () => {
    const restaurants = [
      makeRestaurant({ id: 'r1', name: 'Good Place', avg_score: 6.0 }),
      makeRestaurant({ id: 'r2', name: 'Great Place', avg_score: 9.5 }),
    ]
    const { chain } = makeChain(restaurants)
    vi.mocked(supabase.from).mockReturnValue(chain)
    const { result } = renderHook(() => useRestaurants({ sort: 'rating' }), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const scores = result.current.data!.allRestaurants.map((r) => r.avg_score)
    expect(scores[0]).toBe(9.5)
    expect(scores[1]).toBe(6.0)
  })

  it('computes Haversine distance and sorts by distance when sort="distance"', async () => {
    // r1 at Amherst center, r2 slightly further
    const restaurants = [
      makeRestaurant({ id: 'r1', name: 'Far Away', latitude: 42.4000, longitude: -72.5199 }),
      makeRestaurant({ id: 'r2', name: 'Close By', latitude: 42.3740, longitude: -72.5199 }),
    ]
    const { chain } = makeChain(restaurants)
    vi.mocked(supabase.from).mockReturnValue(chain)
    const { result } = renderHook(
      () =>
        useRestaurants({
          sort: 'distance',
          lat: 42.3732,
          lng: -72.5199,
        }),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const names = result.current.data!.allRestaurants.map((r) => r.name)
    expect(names[0]).toBe('Close By')
    expect(names[1]).toBe('Far Away')
  })

  it('attaches distanceKm to each restaurant when lat/lng provided', async () => {
    const { chain } = makeChain([makeRestaurant()])
    vi.mocked(supabase.from).mockReturnValue(chain)
    const { result } = renderHook(
      () => useRestaurants({ lat: 42.3732, lng: -72.5199 }),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data!.allRestaurants[0].distanceKm).toBeDefined()
    expect(result.current.data!.allRestaurants[0].distanceKm).toBeCloseTo(0, 1)
  })

  it('paginates — page 2 of pageSize 1 returns the second item', async () => {
    const restaurants = [
      makeRestaurant({ id: 'r1', name: 'Alpha' }),
      makeRestaurant({ id: 'r2', name: 'Beta' }),
      makeRestaurant({ id: 'r3', name: 'Gamma' }),
    ]
    const { chain } = makeChain(restaurants)
    vi.mocked(supabase.from).mockReturnValue(chain)
    const { result } = renderHook(
      () => useRestaurants({ sort: 'name', page: 2, pageSize: 1 }),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data!.restaurants).toHaveLength(1)
    expect(result.current.data!.restaurants[0].name).toBe('Beta')
    expect(result.current.data!.total).toBe(3)
    expect(result.current.data!.totalPages).toBe(3)
  })

  it('allRestaurants contains all items regardless of page', async () => {
    const restaurants = [
      makeRestaurant({ id: 'r1', name: 'Alpha' }),
      makeRestaurant({ id: 'r2', name: 'Beta' }),
    ]
    const { chain } = makeChain(restaurants)
    vi.mocked(supabase.from).mockReturnValue(chain)
    const { result } = renderHook(
      () => useRestaurants({ page: 1, pageSize: 1 }),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data!.restaurants).toHaveLength(1)
    expect(result.current.data!.allRestaurants).toHaveLength(2)
  })

  it('surfaces errors from supabase', async () => {
    const { chain } = makeChain([], { code: 'ERR', message: 'fail' })
    vi.mocked(supabase.from).mockReturnValue(chain)
    const { result } = renderHook(() => useRestaurants(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
