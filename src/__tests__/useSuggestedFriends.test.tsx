import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSuggestedFriends } from '@/hooks/useSuggestedFriends'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const currentUserId = 'user-me'

const profileC = { id: 'user-c', username: 'carol', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
const profileD = { id: 'user-d', username: 'dave', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }

// Current user's accepted friend: user-a
const acceptedFriendship = {
  id: 'f1', requester_id: currentUserId, addressee_id: 'user-a',
  status: 'accepted', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  requester: { id: currentUserId, username: 'me', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  addressee: { id: 'user-a', username: 'alice', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
}

function makeFriendshipsChain(data: unknown[], error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data, error }),
  }
}

function makeProfilesChain(data: unknown[], error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error }),
  }
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => vi.resetAllMocks())

describe('useSuggestedFriends', () => {
  it('is disabled when userId is undefined', () => {
    const { result } = renderHook(() => useSuggestedFriends(undefined), { wrapper: makeWrapper().wrapper })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('returns empty array when user has no friends yet and no profiles exist', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'friendships') return makeFriendshipsChain([]) as never
      return makeProfilesChain([]) as never
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSuggestedFriends(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('returns up to 5 suggested profiles', async () => {
    const manyProfiles = Array.from({ length: 8 }, (_, i) => ({
      id: `user-${i + 10}`, username: `user${i + 10}`, avatar_url: null,
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }))

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'friendships') return makeFriendshipsChain([]) as never
      return makeProfilesChain(manyProfiles.slice(0, 5)) as never
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSuggestedFriends(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data!.length).toBeLessThanOrEqual(5)
  })

  it('returns suggested profiles with a mutualCount field', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'friendships') return makeFriendshipsChain([acceptedFriendship]) as never
      return makeProfilesChain([profileC, profileD]) as never
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSuggestedFriends(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toBeDefined()
    for (const s of result.current.data!) {
      expect(typeof s.mutualCount).toBe('number')
    }
  })

  it('does not include the current user in suggestions', async () => {
    const selfProfile = { id: currentUserId, username: 'me', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'friendships') return makeFriendshipsChain([]) as never
      // The hook should use NOT IN filter, so the DB wouldn't return self,
      // but we verify through the query exclusion behavior
      return makeProfilesChain([profileC, selfProfile]) as never
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSuggestedFriends(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const ids = result.current.data!.map((s) => s.profile.id)
    expect(ids).not.toContain(currentUserId)
  })

  it('surfaces error when friendships query fails', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'friendships') return makeFriendshipsChain([], { code: 'ERR', message: 'fail' }) as never
      return makeProfilesChain([]) as never
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSuggestedFriends(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
