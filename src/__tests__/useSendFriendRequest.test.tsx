import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSendFriendRequest } from '@/hooks/useSendFriendRequest'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const input = { requesterId: 'user-me', addresseeId: 'user-a' }

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => vi.resetAllMocks())

describe('useSendFriendRequest', () => {
  it('calls supabase.from("friendships").insert with requester_id and addressee_id', async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({ insert: insertFn } as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSendFriendRequest(), { wrapper })
    await act(async () => { await result.current.mutateAsync(input) })
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({
      requester_id: 'user-me',
      addressee_id: 'user-a',
    }))
  })

  it('throws with a user-friendly message on 23505 (duplicate request)', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { code: '23505', message: 'unique_violation' } }),
    } as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSendFriendRequest(), { wrapper })
    await expect(
      act(async () => { await result.current.mutateAsync(input) }),
    ).rejects.toThrow(/already sent/i)
  })

  it('throws on other supabase errors', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { code: 'OTHER', message: 'DB error' } }),
    } as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSendFriendRequest(), { wrapper })
    await expect(
      act(async () => { await result.current.mutateAsync(input) }),
    ).rejects.toThrow()
  })

  it('invalidates relevant query caches on success', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as never)
    const { qc, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useSendFriendRequest(), { wrapper })
    await act(async () => { await result.current.mutateAsync(input) })
    expect(invalidateSpy).toHaveBeenCalled()
  })
})
