import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSubmitReview } from '@/hooks/useSubmitReview'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const input = {
  restaurantId: 'rest-1',
  userId: 'u1',
  score: 8,
  comment: 'Great food!',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { qc, wrapper }
}

beforeEach(() => vi.resetAllMocks())

describe('useSubmitReview', () => {
  it('calls supabase.from("reviews").insert with the correct data', async () => {
    const insertFn = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.mocked(supabase.from).mockReturnValue({ insert: insertFn } as never)
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useSubmitReview(), { wrapper })
    await act(async () => { await result.current.mutateAsync(input) })
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ restaurant_id: 'rest-1', user_id: 'u1', score: 8 }),
    )
    qc.clear()
  })

  it('throws an error when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'unique' } }),
    } as never)
    const { qc, wrapper } = makeWrapper()
    const { result } = renderHook(() => useSubmitReview(), { wrapper })
    await expect(
      act(async () => { await result.current.mutateAsync(input) }),
    ).rejects.toThrow()
    qc.clear()
  })

  it('invalidates restaurant and review queries on success', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never)
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useSubmitReview(), { wrapper })
    await act(async () => { await result.current.mutateAsync(input) })
    expect(invalidateSpy).toHaveBeenCalled()
    qc.clear()
  })
})
