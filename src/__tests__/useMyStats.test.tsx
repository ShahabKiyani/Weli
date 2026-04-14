import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useMyStats } from '@/hooks/useMyStats'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

function makeChain(scores: number[], error: unknown = null) {
  const data = scores.map((score) => ({ score }))
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data, error }),
  }
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => vi.resetAllMocks())

describe('useMyStats', () => {
  it('returns isLoading=true initially then resolves', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([8, 6, 9]) as never)
    const { result } = renderHook(() => useMyStats('u1'), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useMyStats(undefined), { wrapper: makeWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('computes correct reviewCount and avgScore', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([8, 6, 10]) as never)
    const { result } = renderHook(() => useMyStats('u1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.reviewCount).toBe(3)
    // avg of 8, 6, 10 = 8.0
    expect(result.current.data?.avgScore).toBeCloseTo(8.0)
  })

  it('returns avgScore=null when there are no reviews', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([]) as never)
    const { result } = renderHook(() => useMyStats('u1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.reviewCount).toBe(0)
    expect(result.current.data?.avgScore).toBeNull()
  })

  it('surfaces error when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain([], { code: 'ERR', message: 'fail' }) as never,
    )
    const { result } = renderHook(() => useMyStats('u1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
