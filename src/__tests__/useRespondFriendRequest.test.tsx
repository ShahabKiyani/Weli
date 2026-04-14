import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRespondFriendRequest } from '@/hooks/useRespondFriendRequest'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => vi.resetAllMocks())

describe('useRespondFriendRequest', () => {
  it('calls update({ status: "accepted" }).eq("id", friendshipId) when accepting', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn })
    vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useRespondFriendRequest(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ friendshipId: 'f1', status: 'accepted', userId: 'user-me' })
    })
    expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({ status: 'accepted' }))
    expect(eqFn).toHaveBeenCalledWith('id', 'f1')
  })

  it('calls update({ status: "declined" }).eq("id", friendshipId) when declining', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null })
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn })
    vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useRespondFriendRequest(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ friendshipId: 'f1', status: 'declined', userId: 'user-me' })
    })
    expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({ status: 'declined' }))
  })

  it('throws when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { code: 'ERR', message: 'fail' } }),
      }),
    } as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useRespondFriendRequest(), { wrapper })
    await expect(
      act(async () => {
        await result.current.mutateAsync({ friendshipId: 'f1', status: 'accepted', userId: 'user-me' })
      }),
    ).rejects.toThrow()
  })

  it('invalidates friends and friend-requests caches on success', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never)
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useRespondFriendRequest(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ friendshipId: 'f1', status: 'accepted', userId: 'user-me' })
    })
    expect(invalidateSpy).toHaveBeenCalled()
    const calls = invalidateSpy.mock.calls.map((c) => JSON.stringify(c[0]))
    expect(calls.some((c) => c.includes('friends'))).toBe(true)
    expect(calls.some((c) => c.includes('friend-requests'))).toBe(true)
  })

  it('also invalidates suggested-friends cache on success', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never)
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useRespondFriendRequest(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ friendshipId: 'f1', status: 'declined', userId: 'user-me' })
    })
    const calls = invalidateSpy.mock.calls.map((c) => JSON.stringify(c[0]))
    expect(calls.some((c) => c.includes('suggested-friends'))).toBe(true)
  })
})
