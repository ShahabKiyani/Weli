import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FeedPage from '@/pages/FeedPage'
import { useAuth } from '@/contexts/AuthContext'
import { useFriendFeed } from '@/hooks/useFriendFeed'
import { useFriendRequests } from '@/hooks/useFriendRequests'
import type { AuthContextValue } from '@/contexts/AuthContext'
import type { FriendFeedEntry } from '@/types/database.types'

vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/useFriendFeed')
vi.mock('@/hooks/useFriendRequests')

const mockUser = { id: 'u1', email: 'a@b.com', user_metadata: {} } as never

const mockEntry: FriendFeedEntry = {
  review_id: 'rv1',
  user_id: 'friend-1',
  restaurant_id: 'rest1',
  score: 7,
  comment: 'Nice',
  created_at: '2026-02-01T10:00:00Z',
  username: 'bob',
  avatar_url: null,
  restaurant_name: 'Cafe',
  cuisine_type: 'American',
  restaurant_image_url: null,
}

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: mockUser, profile: null, session: null, loading: false,
    isAuthenticated: true, needsUsername: false,
    signInWithGoogle: vi.fn(), signOut: vi.fn(), refreshProfile: vi.fn(),
    state: { status: 'authenticated' } as AuthContextValue['state'],
    ...overrides,
  }
}

function renderFeed() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.mocked(useAuth).mockReturnValue(makeAuth())
  vi.mocked(useFriendRequests).mockReturnValue({ data: [], isLoading: false } as never)
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/feed']}>
        <Routes>
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/profile" element={<div>Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue(makeAuth())
  vi.mocked(useFriendRequests).mockReturnValue({ data: [], isLoading: false } as never)
})

describe('FeedPage', () => {
  it('renders page heading', () => {
    vi.mocked(useFriendFeed).mockReturnValue({
      data: { entries: [], total: 0, totalPages: 0 },
      isLoading: false,
      isError: false,
    } as never)
    renderFeed()
    expect(screen.getByRole('heading', { name: /^feed$/i })).toBeInTheDocument()
  })

  it('shows skeleton while loading', () => {
    vi.mocked(useFriendFeed).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never)
    renderFeed()
    expect(screen.getByRole('status', { name: /loading feed/i })).toBeInTheDocument()
  })

  it('shows FeedEmptyState when there are no entries', () => {
    vi.mocked(useFriendFeed).mockReturnValue({
      data: { entries: [], total: 0, totalPages: 0 },
      isLoading: false,
      isError: false,
    } as never)
    renderFeed()
    expect(screen.getByText(/add friends to see their reviews/i)).toBeInTheDocument()
  })

  it('renders FeedItem for each entry', () => {
    vi.mocked(useFriendFeed).mockReturnValue({
      data: { entries: [mockEntry], total: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
    } as never)
    renderFeed()
    expect(screen.getByText('Cafe')).toBeInTheDocument()
    expect(screen.getByText('@bob')).toBeInTheDocument()
  })

  it('shows pagination when totalPages > 1', () => {
    vi.mocked(useFriendFeed).mockReturnValue({
      data: { entries: [mockEntry], total: 45, totalPages: 3 },
      isLoading: false,
      isError: false,
    } as never)
    renderFeed()
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
  })

  it('navigates to profile when empty-state CTA is clicked', async () => {
    vi.mocked(useFriendFeed).mockReturnValue({
      data: { entries: [], total: 0, totalPages: 0 },
      isLoading: false,
      isError: false,
    } as never)
    renderFeed()
    await userEvent.click(screen.getByRole('button', { name: /find friends/i }))
    await waitFor(() => expect(screen.getByText('Profile Page')).toBeInTheDocument())
  })
})
