import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useFriends } from '@/hooks/useFriends'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const profileA = { id: 'user-a', username: 'alice', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
const profileB = { id: 'user-b', username: 'bob', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
const profileC = { id: 'user-c', username: 'carol', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }

const currentUserId = 'user-me'

// Friendship where current user is the requester
const friendshipAsRequester = {
  id: 'f1', requester_id: currentUserId, addressee_id: 'user-a',
  status: 'accepted', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  requester: { id: currentUserId, username: 'me', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  addressee: profileA,
}
// Friendship where current user is the addressee
const friendshipAsAddressee = {
  id: 'f2', requester_id: 'user-b', addressee_id: currentUserId,
  status: 'accepted', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  requester: profileB,
  addressee: { id: currentUserId, username: 'me', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
}

function makeChain(data: unknown[], error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data, error }),
  }
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => vi.resetAllMocks())

describe('useFriends', () => {
  it('is disabled and returns undefined when userId is undefined', () => {
    const { result } = renderHook(() => useFriends(undefined), { wrapper: makeWrapper().wrapper })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('returns empty array when user has no accepted friends', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([]) as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriends(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('normalizes a friendship where currentUser is the requester — returns addressee as the friend', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([friendshipAsRequester]) as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriends(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].profile.id).toBe('user-a')
    expect(result.current.data![0].profile.username).toBe('alice')
    expect(result.current.data![0].friendshipId).toBe('f1')
  })

  it('normalizes a friendship where currentUser is the addressee — returns requester as the friend', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([friendshipAsAddressee]) as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriends(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].profile.id).toBe('user-b')
    expect(result.current.data![0].profile.username).toBe('bob')
    expect(result.current.data![0].friendshipId).toBe('f2')
  })

  it('normalizes multiple friendships correctly', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([friendshipAsRequester, friendshipAsAddressee]) as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriends(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(2)
    const ids = result.current.data!.map((f) => f.profile.id)
    expect(ids).toContain('user-a')
    expect(ids).toContain('user-b')
  })

  it('filters out a row where the friend profile is the same as currentUserId (safety guard)', async () => {
    // Malformed row where both sides are the current user (should not occur in DB but guard defensively)
    const malformed = { ...friendshipAsRequester, addressee: { ...profileC, id: currentUserId } }
    vi.mocked(supabase.from).mockReturnValue(makeChain([malformed]) as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriends(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(0)
  })

  it('surfaces error when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([], { code: 'ERR', message: 'db error' }) as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriends(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
