import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useUpdateReview } from '@/hooks/useUpdateReview'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const input = { reviewId: 'rv1', restaurantId: 'rest-1', score: 9, comment: 'Updated!' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

beforeEach(() => vi.resetAllMocks())

describe('useUpdateReview', () => {
  it('calls supabase update().eq() with the correct arguments', async () => {
    const eqFn = vi.fn().mockResolvedValue({ data: null, error: null })
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn })
    vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as never)
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateReview(), { wrapper })
    await act(async () => { await result.current.mutateAsync(input) })
    expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({ score: 9 }))
    expect(eqFn).toHaveBeenCalledWith('id', 'rv1')
    qc.clear()
  })

  it('throws when supabase returns an error', async () => {
    const eqFn = vi.fn().mockResolvedValue({ data: null, error: { code: 'ERR', message: 'fail' } })
    vi.mocked(supabase.from).mockReturnValue({ update: vi.fn().mockReturnValue({ eq: eqFn }) } as never)
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateReview(), { wrapper })
    await expect(
      act(async () => { await result.current.mutateAsync(input) }),
    ).rejects.toThrow()
    qc.clear()
  })

  it('invalidates queries on success', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    } as never)
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateReview(), { wrapper })
    await act(async () => { await result.current.mutateAsync(input) })
    expect(invalidateSpy).toHaveBeenCalled()
    qc.clear()
  })
})
