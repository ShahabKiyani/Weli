import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PublicProfilePage from '@/pages/PublicProfilePage'
import { useAuth } from '@/contexts/AuthContext'
import { usePublicProfile } from '@/hooks/usePublicProfile'
import { useMyReviews } from '@/hooks/useMyReviews'
import { useFriendRequests } from '@/hooks/useFriendRequests'
import { useSendFriendRequest } from '@/hooks/useSendFriendRequest'
import { useRespondFriendRequest } from '@/hooks/useRespondFriendRequest'
import { useUnfriend } from '@/hooks/useUnfriend'
import type { AuthContextValue } from '@/contexts/AuthContext'

vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/usePublicProfile')
vi.mock('@/hooks/useMyReviews')
vi.mock('@/hooks/useFriendRequests')
vi.mock('@/hooks/useSendFriendRequest')
vi.mock('@/hooks/useRespondFriendRequest')
vi.mock('@/hooks/useUnfriend')

const currentUser = { id: 'u1', email: 'me@example.com', user_metadata: {} } as never
const targetProfile = { id: 'user-target', username: 'targetuser', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }

const mockPublicData = {
  profile: targetProfile,
  reviewCount: 3,
  avgScore: 7.5,
  friendshipId: null,
  friendshipStatus: 'none' as const,
  mutualCount: 0,
}

const mockReview = {
  id: 'r1', user_id: 'user-target', restaurant_id: 'rest1', score: 8, comment: 'Great!',
  created_at: '2026-02-01T10:00:00Z', updated_at: '2026-02-01T10:00:00Z',
  restaurants: { id: 'rest1', name: 'Pita Pockets', cuisine_type: 'Mediterranean' },
}

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: currentUser, profile: null, session: null, loading: false,
    isAuthenticated: true, needsUsername: false,
    signInWithGoogle: vi.fn(), signOut: vi.fn(), refreshProfile: vi.fn(),
    state: { status: 'authenticated' } as AuthContextValue['state'],
    ...overrides,
  }
}

function renderPage(userId = 'user-target') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/profile/${userId}`]}>
        <Routes>
          <Route path="/profile" element={<div>My Profile Page</div>} />
          <Route path="/profile/:userId" element={<PublicProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue(makeAuth())
  vi.mocked(usePublicProfile).mockReturnValue({ data: mockPublicData, isLoading: false, isError: false } as never)
  vi.mocked(useMyReviews).mockReturnValue({ data: { reviews: [mockReview as never], total: 1, totalPages: 1 }, isLoading: false } as never)
  vi.mocked(useFriendRequests).mockReturnValue({ data: [], isLoading: false } as never)
  vi.mocked(useSendFriendRequest).mockReturnValue({ mutate: vi.fn(), isPending: false } as never)
  vi.mocked(useRespondFriendRequest).mockReturnValue({ mutate: vi.fn(), isPending: false } as never)
  vi.mocked(useUnfriend).mockReturnValue({ mutate: vi.fn(), isPending: false } as never)
})

describe('PublicProfilePage', () => {
  it('renders the target username', () => {
    renderPage()
    expect(screen.getByText('@targetuser')).toBeInTheDocument()
  })

  it('renders review count and avg score from usePublicProfile', () => {
    renderPage()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('7.5')).toBeInTheDocument()
  })

  it('shows "Add Friend" button when friendship status is "none"', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /add friend/i })).toBeInTheDocument()
  })

  it('shows "Accept" button when friendship status is "pending_received"', () => {
    vi.mocked(usePublicProfile).mockReturnValue({
      data: { ...mockPublicData, friendshipStatus: 'pending_received', friendshipId: 'f1' },
      isLoading: false, isError: false,
    } as never)
    renderPage()
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
  })

  it('shows disabled "Request Sent" button when friendship status is "pending_sent"', () => {
    vi.mocked(usePublicProfile).mockReturnValue({
      data: { ...mockPublicData, friendshipStatus: 'pending_sent', friendshipId: 'f1' },
      isLoading: false, isError: false,
    } as never)
    renderPage()
    expect(screen.getByRole('button', { name: /request sent/i })).toBeDisabled()
  })

  it('shows "Friends" and "Unfriend" when already friends', () => {
    vi.mocked(usePublicProfile).mockReturnValue({
      data: { ...mockPublicData, friendshipStatus: 'accepted', friendshipId: 'f1' },
      isLoading: false, isError: false,
    } as never)
    renderPage()
    expect(screen.getByText(/friends/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /unfriend/i })).toBeInTheDocument()
  })

  it('renders the target user reviews', () => {
    renderPage()
    expect(screen.getByText('Pita Pockets')).toBeInTheDocument()
  })

  it('shows loading skeleton when usePublicProfile is loading', () => {
    vi.mocked(usePublicProfile).mockReturnValue({ data: undefined, isLoading: true, isError: false } as never)
    renderPage()
    expect(screen.getByRole('status', { name: /loading profile/i })).toBeInTheDocument()
  })

  it('shows not-found state when isError is true', () => {
    vi.mocked(usePublicProfile).mockReturnValue({ data: undefined, isLoading: false, isError: true } as never)
    renderPage()
    expect(screen.getByText(/profile not found/i)).toBeInTheDocument()
  })

  it('redirects to /profile when the userId matches the current user', () => {
    renderPage('u1')
    expect(screen.getByText('My Profile Page')).toBeInTheDocument()
  })

  it('calls useSendFriendRequest mutate when "Add Friend" is clicked', async () => {
    const mutateFn = vi.fn()
    vi.mocked(useSendFriendRequest).mockReturnValue({ mutate: mutateFn, isPending: false } as never)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /add friend/i }))
    expect(mutateFn).toHaveBeenCalledWith(expect.objectContaining({
      requesterId: 'u1',
      addresseeId: 'user-target',
    }))
  })

  it('calls useUnfriend mutate when "Unfriend" is clicked', async () => {
    const mutateFn = vi.fn()
    vi.mocked(useUnfriend).mockReturnValue({ mutate: mutateFn, isPending: false } as never)
    vi.mocked(usePublicProfile).mockReturnValue({
      data: { ...mockPublicData, friendshipStatus: 'accepted', friendshipId: 'f1' },
      isLoading: false, isError: false,
    } as never)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /unfriend/i }))
    expect(mutateFn).toHaveBeenCalledWith(expect.objectContaining({ friendshipId: 'f1' }))
  })

  it('shows pagination when reviews span multiple pages', () => {
    vi.mocked(useMyReviews).mockReturnValue({
      data: { reviews: [mockReview as never], total: 25, totalPages: 3 },
      isLoading: false,
    } as never)
    renderPage()
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
  })
})
