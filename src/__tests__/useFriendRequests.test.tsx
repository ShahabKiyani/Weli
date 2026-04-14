import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useFriendRequests } from '@/hooks/useFriendRequests'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

const requesterProfile = { id: 'user-x', username: 'xavier', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }

const pendingRequest = {
  id: 'f-req-1', requester_id: 'user-x', addressee_id: 'user-me',
  status: 'pending', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z',
  requester: requesterProfile,
}

function makeChain(data: unknown[], error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
  }
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => vi.resetAllMocks())

describe('useFriendRequests', () => {
  it('is disabled and returns undefined when userId is undefined', () => {
    const { result } = renderHook(() => useFriendRequests(undefined), { wrapper: makeWrapper().wrapper })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('returns empty array when there are no pending requests', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([]) as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriendRequests('user-me'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('returns pending requests with embedded requester profile', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([pendingRequest]) as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriendRequests('user-me'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].id).toBe('f-req-1')
    expect(result.current.data![0].requester.username).toBe('xavier')
  })

  it('queries with eq(addressee_id) and eq(status, pending)', async () => {
    const chain = makeChain([])
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const { wrapper } = makeWrapper()
    renderHook(() => useFriendRequests('user-me'), { wrapper })
    await waitFor(() => expect(chain.order).toHaveBeenCalled())
    expect(chain.eq).toHaveBeenCalledWith('addressee_id', 'user-me')
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending')
  })

  it('returns multiple requests in descending order (query handles ordering)', async () => {
    const request2 = { ...pendingRequest, id: 'f-req-2', requester_id: 'user-y', requester: { ...requesterProfile, id: 'user-y', username: 'yvonne' } }
    vi.mocked(supabase.from).mockReturnValue(makeChain([pendingRequest, request2]) as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriendRequests('user-me'), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(2)
  })

  it('surfaces error when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([], { code: 'ERR', message: 'fail' }) as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useFriendRequests('user-me'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
