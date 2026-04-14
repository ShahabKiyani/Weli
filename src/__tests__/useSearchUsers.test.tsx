import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSearchUsers } from '@/hooks/useSearchUsers'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const currentUserId = 'user-me'

const profileA = { id: 'user-a', username: 'alice', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
const profileB = { id: 'user-b', username: 'bob', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }

// Existing friendship (current user and user-a are friends)
const existingFriendship = {
  id: 'f1', requester_id: currentUserId, addressee_id: 'user-a',
  status: 'accepted', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
}
// Pending request (current user sent a request to user-b)
const pendingFriendship = {
  id: 'f2', requester_id: currentUserId, addressee_id: 'user-b',
  status: 'pending', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
}

function makeProfileChain(data: unknown[], error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error }),
  }
}

function makeFriendshipChain(data: unknown[], error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    or: vi.fn().mockResolvedValue({ data, error }),
  }
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => vi.resetAllMocks())

describe('useSearchUsers', () => {
  it('is disabled when query is shorter than 2 characters', () => {
    const { result } = renderHook(() => useSearchUsers(currentUserId, 'a'), { wrapper: makeWrapper().wrapper })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('is disabled when currentUserId is undefined', () => {
    const { result } = renderHook(() => useSearchUsers(undefined, 'alice'), { wrapper: makeWrapper().wrapper })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('returns empty array when no profiles match', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') return makeProfileChain([]) as never
      return makeFriendshipChain([]) as never
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSearchUsers(currentUserId, 'xyz'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('annotates a result as status "accepted" when an accepted friendship exists', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') return makeProfileChain([profileA]) as never
      return makeFriendshipChain([existingFriendship]) as never
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSearchUsers(currentUserId, 'alic'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].profile.username).toBe('alice')
    expect(result.current.data![0].friendshipStatus).toBe('accepted')
    expect(result.current.data![0].friendshipId).toBe('f1')
  })

  it('annotates a result as status "pending_sent" when a pending friendship was sent by current user', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') return makeProfileChain([profileB]) as never
      return makeFriendshipChain([pendingFriendship]) as never
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSearchUsers(currentUserId, 'bo'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data![0].friendshipStatus).toBe('pending_sent')
  })

  it('annotates a result as status "pending_received" when a pending friendship was received', async () => {
    const incomingPending = { ...pendingFriendship, requester_id: 'user-b', addressee_id: currentUserId }
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') return makeProfileChain([profileB]) as never
      return makeFriendshipChain([incomingPending]) as never
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSearchUsers(currentUserId, 'bo'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data![0].friendshipStatus).toBe('pending_received')
  })

  it('annotates a result as status "none" when no friendship exists', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') return makeProfileChain([profileA]) as never
      return makeFriendshipChain([]) as never
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSearchUsers(currentUserId, 'alic'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data![0].friendshipStatus).toBe('none')
    expect(result.current.data![0].friendshipId).toBeNull()
  })

  it('surfaces error when the profiles query fails', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') return makeProfileChain([], { code: 'ERR', message: 'fail' }) as never
      return makeFriendshipChain([]) as never
    })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSearchUsers(currentUserId, 'alic'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
