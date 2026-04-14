import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDeleteReview } from '@/hooks/useDeleteReview'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

beforeEach(() => vi.resetAllMocks())

describe('useDeleteReview', () => {
  it('calls supabase delete().eq() with the review id', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    const deleteFn = vi.fn().mockReturnValue({ eq: eqFn })
    vi.mocked(supabase.from).mockReturnValue({ delete: deleteFn } as never)
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useDeleteReview(), { wrapper })
    await act(async () => { await result.current.mutateAsync({ reviewId: 'rv42', restaurantId: 'rest-1' }) })
    expect(deleteFn).toHaveBeenCalled()
    expect(eqFn).toHaveBeenCalledWith('id', 'rv42')
    qc.clear()
  })

  it('throws when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { code: 'ERR', message: 'fail' } }),
      }),
    } as never)
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useDeleteReview(), { wrapper })
    await expect(
      act(async () => { await result.current.mutateAsync({ reviewId: 'rv42', restaurantId: 'rest-1' }) }),
    ).rejects.toThrow()
    qc.clear()
  })

  it('invalidates queries on success', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never)
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteReview(), { wrapper })
    await act(async () => { await result.current.mutateAsync({ reviewId: 'rv42', restaurantId: 'rest-1' }) })
    expect(invalidateSpy).toHaveBeenCalled()
    qc.clear()
  })
})
