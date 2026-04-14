import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRestaurant } from '@/hooks/useRestaurant'
import { supabase } from '@/lib/supabase'
import type { RestaurantStats } from '@/types/database.types'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const mockRestaurant: RestaurantStats = {
  id: 'rest-1',
  name: 'Pita Pockets',
  address: '1 Main St, Amherst',
  latitude: 42.3732,
  longitude: -72.5199,
  cuisine_type: 'Mediterranean',
  description: 'Tasty pitas',
  image_url: null,
  phone: null,
  website: null,
  google_place_id: 'gplace_123',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  avg_score: 8.2,
  review_count: 14,
}

function makeChain(data: RestaurantStats | null, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => vi.resetAllMocks())

describe('useRestaurant', () => {
  it('is loading initially', () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(mockRestaurant) as never)
    const { result } = renderHook(() => useRestaurant('rest-1'), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns restaurant data on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(mockRestaurant) as never)
    const { result } = renderHook(() => useRestaurant('rest-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.name).toBe('Pita Pockets')
  })

  it('is disabled when id is undefined', () => {
    const { result } = renderHook(() => useRestaurant(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('surfaces error when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { code: 'PGRST116', message: 'Not found' }) as never,
    )
    const { result } = renderHook(() => useRestaurant('bad-id'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('calls .single() to fetch exactly one row', async () => {
    const chain = makeChain(mockRestaurant)
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const { result } = renderHook(() => useRestaurant('rest-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(chain.single).toHaveBeenCalledOnce()
  })
})
