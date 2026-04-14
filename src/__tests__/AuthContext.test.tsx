import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}))

const mockSubscription = { data: { subscription: { unsubscribe: vi.fn() } } }

const mockProfileChain = (profileData: Record<string, unknown> | null, error: unknown = null) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: profileData, error }),
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue(mockSubscription as never)
})

describe('useAuth outside AuthProvider', () => {
  it('throws with a descriptive message', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    )
    consoleError.mockRestore()
  })
})

describe('AuthProvider — unauthenticated flow', () => {
  it('starts in loading state before getSession resolves', () => {
    vi.mocked(supabase.auth.getSession).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.loading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('becomes unauthenticated when no session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.needsUsername).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
    expect(result.current.session).toBeNull()
  })
})

describe('AuthProvider — authenticated flow', () => {
  const mockUser = { id: 'user-1', email: 'test@example.com' }
  const mockSession = { user: mockUser, access_token: 'tok' }

  it('becomes authenticated when session exists and profile has a username', async () => {
    const mockProfile = {
      id: 'user-1',
      username: 'testuser',
      avatar_url: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as never)
    vi.mocked(supabase.from).mockReturnValue(mockProfileChain(mockProfile) as never)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    expect(result.current.user?.id).toBe('user-1')
    expect(result.current.profile?.username).toBe('testuser')
    expect(result.current.needsUsername).toBe(false)
  })

  it('sets needsUsername when profile.username is null', async () => {
    const profileNoUsername = {
      id: 'user-1',
      username: null,
      avatar_url: 'https://google.com/avatar.jpg',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as never)
    vi.mocked(supabase.from).mockReturnValue(mockProfileChain(profileNoUsername) as never)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.needsUsername).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user?.id).toBe('user-1')
  })

  it('falls back to unauthenticated when profile fetch fails', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as never)
    vi.mocked(supabase.from).mockReturnValue(
      mockProfileChain(null, { code: 'PGRST116', message: 'not found' }) as never,
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})

describe('AuthProvider — actions', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never)
  })

  it('signInWithGoogle calls signInWithOAuth with google provider and redirectTo', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { provider: 'google', url: '' },
      error: null,
    } as never)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.signInWithGoogle()
    })

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    )
    const call = vi.mocked(supabase.auth.signInWithOAuth).mock.calls[0][0]
    expect(call.options?.redirectTo).toContain('/auth/callback')
  })

  it('signOut calls supabase.auth.signOut and clears auth state', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.signOut()
    })

    expect(supabase.auth.signOut).toHaveBeenCalledOnce()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('cleans up the onAuthStateChange subscription on unmount', async () => {
    const unsubscribeMock = vi.fn()
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    } as never)

    const { result, unmount } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    unmount()
    expect(unsubscribeMock).toHaveBeenCalledOnce()
  })
})
