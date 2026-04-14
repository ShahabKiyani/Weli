import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRestaurantReviews } from '@/hooks/useRestaurantReviews'
import { supabase } from '@/lib/supabase'
import type { ReviewWithProfile } from '@/types/database.types'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const mockReview: ReviewWithProfile = {
  id: 'rv1',
  user_id: 'u1',
  restaurant_id: 'rest-1',
  score: 8,
  comment: 'Great food!',
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-01T10:00:00Z',
  profiles: { username: 'foodie', avatar_url: null },
}

function makeChain(data: ReviewWithProfile[], count = data.length, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data, count, error }),
  }
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => vi.resetAllMocks())

describe('useRestaurantReviews', () => {
  it('returns reviews with embedded profile data', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([mockReview]) as never)
    const { result } = renderHook(() => useRestaurantReviews('rest-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.reviews[0].profiles?.username).toBe('foodie')
  })

  it('returns total and totalPages from count', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([mockReview], 30) as never)
    const { result } = renderHook(
      () => useRestaurantReviews('rest-1', { pageSize: 10 }),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.total).toBe(30)
    expect(result.current.data?.totalPages).toBe(3)
  })

  it('passes correct range for page 2', async () => {
    const chain = makeChain([mockReview])
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const { result } = renderHook(
      () => useRestaurantReviews('rest-1', { page: 2, pageSize: 10 }),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(chain.range).toHaveBeenCalledWith(10, 19)
  })

  it('returns empty reviews when restaurant has none', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([], 0) as never)
    const { result } = renderHook(() => useRestaurantReviews('rest-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.reviews).toHaveLength(0)
    expect(result.current.data?.total).toBe(0)
  })

  it('defaults to page 1 — range(0, pageSize-1)', async () => {
    const chain = makeChain([mockReview])
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const { result } = renderHook(
      () => useRestaurantReviews('rest-1', { pageSize: 5 }),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(chain.range).toHaveBeenCalledWith(0, 4)
  })

  it('surfaces error from supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain([], 0, { code: 'ERR', message: 'fail' }) as never,
    )
    const { result } = renderHook(() => useRestaurantReviews('rest-1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
