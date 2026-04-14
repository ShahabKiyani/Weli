import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { usePublicProfile } from '@/hooks/usePublicProfile'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const targetId = 'user-target'
const currentId = 'user-me'

const mockProfile = {
  id: targetId,
  username: 'targetuser',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const mockReviews = [{ score: 8 }, { score: 6 }]

const acceptedFriendship = {
  id: 'f1',
  requester_id: currentId,
  addressee_id: targetId,
  status: 'accepted',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

function setupMocks({
  profiles = [mockProfile],
  profileError = null,
  reviews = mockReviews,
  reviewError = null,
  friendships = [] as typeof acceptedFriendship[],
  friendshipError = null,
} = {}) {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: profiles, error: profileError }),
      } as never
    }
    if (table === 'reviews') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: reviews, error: reviewError }),
      } as never
    }
    // friendships
    return {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ data: friendships, error: friendshipError }),
    } as never
  })
}

beforeEach(() => vi.resetAllMocks())

describe('usePublicProfile', () => {
  it('is disabled when targetUserId is undefined', () => {
    const { result } = renderHook(() => usePublicProfile(undefined, currentId), { wrapper: makeWrapper().wrapper })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('is disabled when currentUserId is undefined', () => {
    const { result } = renderHook(() => usePublicProfile(targetId, undefined), { wrapper: makeWrapper().wrapper })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('returns profile, reviewCount, and avgScore', async () => {
    setupMocks()
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePublicProfile(targetId, currentId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.profile.username).toBe('targetuser')
    expect(result.current.data?.reviewCount).toBe(2)
    expect(result.current.data?.avgScore).toBe(7)
  })

  it('returns reviewCount=0 and avgScore=null when user has no reviews', async () => {
    setupMocks({ reviews: [] })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePublicProfile(targetId, currentId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.reviewCount).toBe(0)
    expect(result.current.data?.avgScore).toBeNull()
  })

  it('returns friendshipStatus "none" and friendshipId null when no friendship exists', async () => {
    setupMocks({ friendships: [] })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePublicProfile(targetId, currentId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.friendshipStatus).toBe('none')
    expect(result.current.data?.friendshipId).toBeNull()
  })

  it('returns friendshipStatus "accepted" for an accepted friendship', async () => {
    setupMocks({ friendships: [acceptedFriendship] })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePublicProfile(targetId, currentId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.friendshipStatus).toBe('accepted')
    expect(result.current.data?.friendshipId).toBe('f1')
  })

  it('returns friendshipStatus "pending_sent" when current user sent the request', async () => {
    const pending = { id: 'f2', requester_id: currentId, addressee_id: targetId, status: 'pending' }
    setupMocks({ friendships: [pending] })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePublicProfile(targetId, currentId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.friendshipStatus).toBe('pending_sent')
  })

  it('returns friendshipStatus "pending_received" when target user sent the request', async () => {
    const pending = { id: 'f3', requester_id: targetId, addressee_id: currentId, status: 'pending' }
    setupMocks({ friendships: [pending] })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePublicProfile(targetId, currentId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.friendshipStatus).toBe('pending_received')
  })

  it('returns mutualCount of 0 (MVP limitation)', async () => {
    setupMocks({ friendships: [acceptedFriendship] })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePublicProfile(targetId, currentId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.mutualCount).toBe(0)
  })

  it('throws when profile is not found (empty result)', async () => {
    setupMocks({ profiles: [] })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePublicProfile(targetId, currentId), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('surfaces error when the profiles query fails', async () => {
    setupMocks({ profileError: { message: 'DB error' } })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePublicProfile(targetId, currentId), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
