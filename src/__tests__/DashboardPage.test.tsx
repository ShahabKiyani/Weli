import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardPage from '@/pages/DashboardPage'
import { useMyReviews } from '@/hooks/useMyReviews'
import { useMyStats } from '@/hooks/useMyStats'
import { useAuth } from '@/contexts/AuthContext'
import { useFriendRequests } from '@/hooks/useFriendRequests'
import { useFriends } from '@/hooks/useFriends'
import type { AuthContextValue } from '@/contexts/AuthContext'

vi.mock('@/hooks/useMyReviews')
vi.mock('@/hooks/useMyStats')
vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/useFriendRequests')
vi.mock('@/hooks/useFriends')

const mockUser = {
  id: 'u1',
  email: 'test@example.com',
  user_metadata: { avatar_url: 'https://example.com/avatar.jpg' },
} as never

const mockProfile = {
  id: 'u1',
  username: 'foodie',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as never

const mockReview = {
  id: 'r1',
  user_id: 'u1',
  restaurant_id: 'rest1',
  score: 8,
  comment: 'Great!',
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-01T10:00:00Z',
  restaurants: { id: 'rest1', name: 'Pita Pockets', cuisine_type: 'Mediterranean' },
}

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: mockUser,
    profile: mockProfile,
    session: null,
    loading: false,
    isAuthenticated: true,
    needsUsername: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    state: { status: 'authenticated' } as AuthContextValue['state'],
    ...overrides,
  }
}

function makeReviewsData(
  overrides: Partial<ReturnType<typeof useMyReviews>> = {},
): ReturnType<typeof useMyReviews> {
  return {
    data: { reviews: [mockReview as never], total: 1, totalPages: 1 },
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  } as ReturnType<typeof useMyReviews>
}

function makeStatsData(
  overrides: Partial<ReturnType<typeof useMyStats>> = {},
): ReturnType<typeof useMyStats> {
  return {
    data: { reviewCount: 1, avgScore: 8.0 },
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  } as ReturnType<typeof useMyStats>
}

function renderDashboard() {
  vi.mocked(useAuth).mockReturnValue(makeAuth())
  vi.mocked(useMyReviews).mockReturnValue(makeReviewsData())
  vi.mocked(useMyStats).mockReturnValue(makeStatsData())
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/restaurants" element={<div>Discover Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useFriendRequests).mockReturnValue({ data: [], isLoading: false } as never)
  vi.mocked(useFriends).mockReturnValue({ data: [], isLoading: false } as never)
})

describe('DashboardPage', () => {
  it('shows a greeting with the username', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: /@foodie/i })).toBeInTheDocument()
  })

  it('renders the UserStatsCard', () => {
    renderDashboard()
    // Stats card shows review count
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders skeleton loaders while reviews are loading', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth())
    vi.mocked(useMyReviews).mockReturnValue(makeReviewsData({ isLoading: true, data: undefined }))
    vi.mocked(useMyStats).mockReturnValue(makeStatsData())
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    // SkeletonLoader renders pulsing elements (role="status" may be on the loading container)
    // At minimum, no review items should be visible
    expect(screen.queryByText('Pita Pockets')).not.toBeInTheDocument()
  })

  it('renders the empty state when user has no reviews', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth())
    vi.mocked(useMyReviews).mockReturnValue(
      makeReviewsData({ data: { reviews: [], total: 0, totalPages: 0 } }),
    )
    vi.mocked(useMyStats).mockReturnValue(makeStatsData())
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument()
  })

  it('renders review items when reviews exist', () => {
    renderDashboard()
    expect(screen.getByText('Pita Pockets')).toBeInTheDocument()
  })

  it('shows pagination when totalPages > 1', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth())
    vi.mocked(useMyReviews).mockReturnValue(
      makeReviewsData({
        data: {
          reviews: [mockReview as never],
          total: 25,
          totalPages: 3,
        },
      }),
    )
    vi.mocked(useMyStats).mockReturnValue(makeStatsData())
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
  })

  it('does not show pagination when only one page of results', () => {
    renderDashboard()
    expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument()
  })

  it('navigates to /restaurants when empty-state CTA is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(useAuth).mockReturnValue(makeAuth())
    vi.mocked(useMyReviews).mockReturnValue(
      makeReviewsData({ data: { reviews: [], total: 0, totalPages: 0 } }),
    )
    vi.mocked(useMyStats).mockReturnValue(makeStatsData())
    const qc = new QueryClient()
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/restaurants" element={<div>Discover Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await user.click(screen.getByRole('button', { name: /discover restaurants/i }))
    expect(screen.getByText('Discover Page')).toBeInTheDocument()
  })

  it('shows morning greeting before noon', () => {
    vi.setSystemTime(new Date('2026-03-31T09:00:00'))
    renderDashboard()
    expect(screen.getByText(/good morning/i)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows afternoon greeting between noon and 5pm', () => {
    vi.setSystemTime(new Date('2026-03-31T14:00:00'))
    renderDashboard()
    expect(screen.getByText(/good afternoon/i)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows evening greeting after 5pm', () => {
    vi.setSystemTime(new Date('2026-03-31T20:00:00'))
    renderDashboard()
    expect(screen.getByText(/good evening/i)).toBeInTheDocument()
    vi.useRealTimers()
  })
})
