import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useFriendFeed } from '@/hooks/useFriendFeed'
import { useFriends } from '@/hooks/useFriends'
import { supabase } from '@/lib/supabase'

vi.mock('@/hooks/useFriends')
vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const currentUserId = 'user-me'

const mockFriendProfiles = [
  { friendshipId: 'f1', profile: { id: 'friend-a', username: 'alice', avatar_url: null, created_at: '', updated_at: '' } },
]

const mockEntry = {
  review_id: 'rv1',
  user_id: 'friend-a',
  restaurant_id: 'rest1',
  score: 8,
  comment: 'Great!',
  created_at: '2026-02-01T10:00:00Z',
  username: 'alice',
  avatar_url: null,
  restaurant_name: 'Pita Pockets',
  cuisine_type: 'Mediterranean',
  restaurant_image_url: null,
}

function makeChain(data: unknown[], count: number | null, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data, count, error }),
  }
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('useFriendFeed', () => {
  it('is disabled when userId is undefined', () => {
    vi.mocked(useFriends).mockReturnValue({ data: undefined, isLoading: false } as never)
    const { result } = renderHook(() => useFriendFeed(undefined), { wrapper: makeWrapper().wrapper })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('reports loading while friends are still loading', () => {
    vi.mocked(useFriends).mockReturnValue({ data: undefined, isLoading: true } as never)
    const { result } = renderHook(() => useFriendFeed(currentUserId), { wrapper: makeWrapper().wrapper })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns empty result without querying friend_feed when user has no friends', async () => {
    vi.mocked(useFriends).mockReturnValue({ data: [], isLoading: false } as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriendFeed(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.entries).toEqual([])
    expect(result.current.data?.total).toBe(0)
    expect(supabase.from).not.toHaveBeenCalledWith('friend_feed')
  })

  it('queries friend_feed with user_id in friend ids, ordered by created_at desc', async () => {
    vi.mocked(useFriends).mockReturnValue({ data: mockFriendProfiles, isLoading: false } as never)
    const chain = makeChain([mockEntry], 1)
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriendFeed(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(chain.in).toHaveBeenCalledWith('user_id', ['friend-a'])
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.current.data?.entries).toHaveLength(1)
    expect(result.current.data?.entries[0].restaurant_name).toBe('Pita Pockets')
  })

  it('uses range for page 2 with page size 20', async () => {
    vi.mocked(useFriends).mockReturnValue({ data: mockFriendProfiles, isLoading: false } as never)
    const chain = makeChain([], 0)
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const { wrapper } = makeWrapper()
    renderHook(() => useFriendFeed(currentUserId, { page: 2 }), { wrapper })
    await waitFor(() => expect(chain.range).toHaveBeenCalled())
    expect(chain.range).toHaveBeenCalledWith(20, 39)
  })

  it('surfaces error when friend_feed query fails', async () => {
    vi.mocked(useFriends).mockReturnValue({ data: mockFriendProfiles, isLoading: false } as never)
    vi.mocked(supabase.from).mockReturnValue(
      makeChain([], 0, { message: 'fail' }) as never,
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriendFeed(currentUserId), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
