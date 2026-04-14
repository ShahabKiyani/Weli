import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useUnfriend } from '@/hooks/useUnfriend'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => vi.resetAllMocks())

describe('useUnfriend', () => {
  it('calls supabase.from("friendships").delete().eq("id", friendshipId)', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    const deleteFn = vi.fn().mockReturnValue({ eq: eqFn })
    vi.mocked(supabase.from).mockReturnValue({ delete: deleteFn } as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUnfriend(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ friendshipId: 'f-abc', userId: 'user-me' })
    })
    expect(deleteFn).toHaveBeenCalled()
    expect(eqFn).toHaveBeenCalledWith('id', 'f-abc')
  })

  it('throws when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { code: 'ERR', message: 'fail' } }),
      }),
    } as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUnfriend(), { wrapper })
    await expect(
      act(async () => {
        await result.current.mutateAsync({ friendshipId: 'f-abc', userId: 'user-me' })
      }),
    ).rejects.toThrow()
  })

  it('invalidates friends cache on success', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never)
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUnfriend(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ friendshipId: 'f-abc', userId: 'user-me' })
    })
    expect(invalidateSpy).toHaveBeenCalled()
  })

  it('invalidates suggested-friends cache on success', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never)
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUnfriend(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ friendshipId: 'f-abc', userId: 'user-me' })
    })
    const calls = invalidateSpy.mock.calls.map((c) => JSON.stringify(c[0]))
    expect(calls.some((c) => c.includes('suggested-friends'))).toBe(true)
  })
})
