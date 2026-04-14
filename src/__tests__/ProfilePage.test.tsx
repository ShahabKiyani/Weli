import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProfilePage from '@/pages/ProfilePage'
import { useAuth } from '@/contexts/AuthContext'
import { useMyStats } from '@/hooks/useMyStats'
import { useFriendRequests } from '@/hooks/useFriendRequests'
import { useFriends } from '@/hooks/useFriends'
import { useSuggestedFriends } from '@/hooks/useSuggestedFriends'
import { useRespondFriendRequest } from '@/hooks/useRespondFriendRequest'
import { useUnfriend } from '@/hooks/useUnfriend'
import { useSendFriendRequest } from '@/hooks/useSendFriendRequest'
import { useUploadAvatar } from '@/hooks/useUploadAvatar'
import { useSearchUsers } from '@/hooks/useSearchUsers'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuthContextValue } from '@/contexts/AuthContext'

vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/useMyStats')
vi.mock('@/hooks/useFriendRequests')
vi.mock('@/hooks/useFriends')
vi.mock('@/hooks/useSuggestedFriends')
vi.mock('@/hooks/useRespondFriendRequest')
vi.mock('@/hooks/useUnfriend')
vi.mock('@/hooks/useSendFriendRequest')
vi.mock('@/hooks/useUploadAvatar')
vi.mock('@/hooks/useSearchUsers')
vi.mock('@/hooks/useDebounce')

const mockUser = { id: 'u1', email: 'test@example.com', user_metadata: {} } as never
const mockProfile = { id: 'u1', username: 'foodie', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' } as never

const requesterProfile = { id: 'user-x', username: 'xavier', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
const pendingRequest = { id: 'f-req-1', requester_id: 'user-x', addressee_id: 'u1', status: 'pending', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z', requester: requesterProfile }

const friendProfile = { id: 'user-a', username: 'alice', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
const suggestedProfile = { id: 'user-s', username: 'sam', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: mockUser, profile: mockProfile, session: null, loading: false,
    isAuthenticated: true, needsUsername: false,
    signInWithGoogle: vi.fn(), signOut: vi.fn(), refreshProfile: vi.fn(),
    state: { status: 'authenticated' } as AuthContextValue['state'],
    ...overrides,
  }
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<div>Public Profile</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue(makeAuth())
  vi.mocked(useMyStats).mockReturnValue({ data: { reviewCount: 5, avgScore: 7.4 }, isLoading: false } as never)
  vi.mocked(useFriendRequests).mockReturnValue({ data: [], isLoading: false } as never)
  vi.mocked(useFriends).mockReturnValue({ data: [], isLoading: false } as never)
  vi.mocked(useSuggestedFriends).mockReturnValue({ data: [], isLoading: false } as never)
  vi.mocked(useRespondFriendRequest).mockReturnValue({ mutate: vi.fn(), isPending: false } as never)
  vi.mocked(useUnfriend).mockReturnValue({ mutate: vi.fn(), isPending: false } as never)
  vi.mocked(useSendFriendRequest).mockReturnValue({ mutate: vi.fn(), isPending: false } as never)
  vi.mocked(useUploadAvatar).mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isError: false,
    isIdle: true,
    reset: vi.fn(),
  } as never)
  vi.mocked(useSearchUsers).mockReturnValue({ data: undefined, isLoading: false } as never)
  vi.mocked(useDebounce).mockImplementation((v) => v)
})

describe('ProfilePage', () => {
  it('renders the page heading', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument()
  })

  it('renders the UserStatsCard with stats', () => {
    renderPage()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows Change photo and hidden file input for avatar upload', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /change photo/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/upload profile photo/i)).toBeInTheDocument()
  })

  it('does not show the Friend Requests section when there are no pending requests', () => {
    renderPage()
    expect(screen.queryByText(/friend requests/i)).not.toBeInTheDocument()
  })

  it('shows the Friend Requests section when there are pending requests', () => {
    vi.mocked(useFriendRequests).mockReturnValue({ data: [pendingRequest], isLoading: false } as never)
    renderPage()
    expect(screen.getByText(/friend requests/i)).toBeInTheDocument()
    expect(screen.getByText('@xavier')).toBeInTheDocument()
  })

  it('shows the pending request count in the section heading', () => {
    vi.mocked(useFriendRequests).mockReturnValue({ data: [pendingRequest], isLoading: false } as never)
    renderPage()
    expect(screen.getByText(/friend requests.*1/i)).toBeInTheDocument()
  })

  it('renders the Friends section', () => {
    renderPage()
    expect(screen.getByRole('region', { name: /^friends$/i })).toBeInTheDocument()
  })

  it('shows a "Find Friends" button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /find friends/i })).toBeInTheDocument()
  })

  it('opens the FindFriendsModal when "Find Friends" is clicked', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /find friends/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders friends list when friends exist', () => {
    vi.mocked(useFriends).mockReturnValue({
      data: [{ friendshipId: 'f1', profile: friendProfile }],
      isLoading: false,
    } as never)
    renderPage()
    expect(screen.getByText('@alice')).toBeInTheDocument()
  })

  it('shows Suggested Friends section when suggestions exist', () => {
    vi.mocked(useSuggestedFriends).mockReturnValue({
      data: [{ profile: suggestedProfile, mutualCount: 0 }],
      isLoading: false,
    } as never)
    renderPage()
    expect(screen.getByText(/people you may know/i)).toBeInTheDocument()
    expect(screen.getByText('@sam')).toBeInTheDocument()
  })

  it('does not show Suggested Friends section when there are no suggestions', () => {
    vi.mocked(useSuggestedFriends).mockReturnValue({ data: [], isLoading: false } as never)
    renderPage()
    expect(screen.queryByText(/people you may know/i)).not.toBeInTheDocument()
  })

  it('calls useRespondFriendRequest mutate when Accept is clicked', async () => {
    const mutateFn = vi.fn()
    vi.mocked(useFriendRequests).mockReturnValue({ data: [pendingRequest], isLoading: false } as never)
    vi.mocked(useRespondFriendRequest).mockReturnValue({ mutate: mutateFn, isPending: false } as never)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /^accept$/i }))
    expect(mutateFn).toHaveBeenCalledWith(expect.objectContaining({
      friendshipId: 'f-req-1',
      status: 'accepted',
    }))
  })

  it('calls useRespondFriendRequest mutate when Decline is clicked', async () => {
    const mutateFn = vi.fn()
    vi.mocked(useFriendRequests).mockReturnValue({ data: [pendingRequest], isLoading: false } as never)
    vi.mocked(useRespondFriendRequest).mockReturnValue({ mutate: mutateFn, isPending: false } as never)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /decline/i }))
    expect(mutateFn).toHaveBeenCalledWith(expect.objectContaining({
      friendshipId: 'f-req-1',
      status: 'declined',
    }))
  })

  it('calls useUnfriend mutate when Unfriend is clicked on a friend', async () => {
    const mutateFn = vi.fn()
    vi.mocked(useFriends).mockReturnValue({
      data: [{ friendshipId: 'f1', profile: friendProfile }],
      isLoading: false,
    } as never)
    vi.mocked(useUnfriend).mockReturnValue({ mutate: mutateFn, isPending: false } as never)
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /unfriend/i }))
    expect(mutateFn).toHaveBeenCalledWith(expect.objectContaining({ friendshipId: 'f1' }))
  })
})
