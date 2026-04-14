import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useMyReviews } from '@/hooks/useMyReviews'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

const mockReview = {
  id: 'r1',
  user_id: 'u1',
  restaurant_id: 'rest1',
  score: 8,
  comment: 'Really good food',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
  restaurants: { id: 'rest1', name: 'Pita Pockets', cuisine_type: 'Mediterranean' },
}

function makeChain(data: unknown[], count = data.length, error: unknown = null) {
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

describe('useMyReviews', () => {
  it('returns isLoading=true initially and then resolves with data', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([mockReview]) as never)
    const { result } = renderHook(() => useMyReviews('u1'), { wrapper: makeWrapper() })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.reviews).toHaveLength(1)
    expect(result.current.data?.reviews[0].id).toBe('r1')
  })

  it('is disabled (no query) when userId is undefined', () => {
    const { result } = renderHook(() => useMyReviews(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('returns total and totalPages based on count', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([mockReview], 42) as never)
    const { result } = renderHook(() => useMyReviews('u1', { pageSize: 10 }), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.total).toBe(42)
    expect(result.current.data?.totalPages).toBe(5)
  })

  it('returns empty reviews array and total=0 when user has no reviews', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([], 0) as never)
    const { result } = renderHook(() => useMyReviews('u1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.reviews).toHaveLength(0)
    expect(result.current.data?.total).toBe(0)
    expect(result.current.data?.totalPages).toBe(0)
  })

  it('uses range based on page and pageSize', async () => {
    const chain = makeChain([mockReview])
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const { result } = renderHook(() => useMyReviews('u1', { page: 2, pageSize: 10 }), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    // Page 2, size 10 → range(10, 19)
    expect(chain.range).toHaveBeenCalledWith(10, 19)
  })

  it('defaults to page 1 with range(0, DEFAULT_PAGE_SIZE - 1)', async () => {
    const chain = makeChain([mockReview])
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const { result } = renderHook(() => useMyReviews('u1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    // default pageSize = 20 → range(0, 19)
    expect(chain.range).toHaveBeenCalledWith(0, 19)
  })

  it('surfaces error when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain([], 0, { code: 'ERR', message: 'DB error' }) as never,
    )
    const { result } = renderHook(() => useMyReviews('u1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
