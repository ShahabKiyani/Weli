import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useUserReview } from '@/hooks/useUserReview'
import { supabase } from '@/lib/supabase'
import type { Review } from '@/types/database.types'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const mockReview: Review = {
  id: 'rv1',
  user_id: 'u1',
  restaurant_id: 'rest-1',
  score: 8,
  comment: 'Great!',
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-01T10:00:00Z',
}

function makeChain(data: Review | null, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  }
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => vi.resetAllMocks())

describe('useUserReview', () => {
  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(
      () => useUserReview('rest-1', undefined),
      { wrapper: makeWrapper() },
    )
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('returns the review when the user has reviewed', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(mockReview) as never)
    const { result } = renderHook(
      () => useUserReview('rest-1', 'u1'),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.score).toBe(8)
  })

  it('returns null when the user has no review for this restaurant', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(null) as never)
    const { result } = renderHook(
      () => useUserReview('rest-1', 'u1'),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toBeNull()
  })

  it('calls .maybeSingle() — does not error on zero rows', async () => {
    const chain = makeChain(null)
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const { result } = renderHook(
      () => useUserReview('rest-1', 'u1'),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(chain.maybeSingle).toHaveBeenCalledOnce()
    expect(result.current.isError).toBe(false)
  })

  it('surfaces error from supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { code: 'ERR', message: 'DB error' }) as never,
    )
    const { result } = renderHook(
      () => useUserReview('rest-1', 'u1'),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
