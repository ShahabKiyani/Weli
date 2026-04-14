import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RestaurantDetailPage from '@/pages/RestaurantDetailPage'
import { useAuth } from '@/contexts/AuthContext'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useRestaurantReviews } from '@/hooks/useRestaurantReviews'
import { useUserReview } from '@/hooks/useUserReview'
import type { AuthContextValue } from '@/contexts/AuthContext'
import type { RestaurantStats, ReviewWithProfile } from '@/types/database.types'

vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/useRestaurant')
vi.mock('@/hooks/useRestaurantReviews')
vi.mock('@/hooks/useUserReview')
vi.mock('@/components/RestaurantLocationMap', () => ({
  RestaurantLocationMap: ({ restaurant }: { restaurant: RestaurantStats }) => (
    <div data-testid="location-map">{restaurant.name}</div>
  ),
}))

const mockRestaurant: RestaurantStats = {
  id: 'rest-1',
  name: 'Pita Pockets',
  address: '1 Main St, Amherst',
  latitude: 42.3732,
  longitude: -72.5199,
  cuisine_type: 'Mediterranean',
  description: null,
  image_url: null,
  phone: null,
  website: null,
  google_place_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  avg_score: 8.2,
  review_count: 14,
}

const mockReview: ReviewWithProfile = {
  id: 'rv1',
  user_id: 'u1',
  restaurant_id: 'rest-1',
  score: 8,
  comment: 'Delicious!',
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-01T10:00:00Z',
  profiles: { username: 'foodie', avatar_url: null },
}

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: { id: 'u1', email: 'test@example.com', user_metadata: {} } as never,
    profile: { id: 'u1', username: 'foodie', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' } as never,
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

function renderPage(restaurantId = 'rest-1') {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/restaurants/${restaurantId}`]}>
        <Routes>
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="/restaurants/:id/review" element={<div>Review Form</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue(makeAuth())
  vi.mocked(useRestaurant).mockReturnValue({
    data: mockRestaurant,
    isLoading: false,
    isError: false,
    error: null,
  } as ReturnType<typeof useRestaurant>)
  vi.mocked(useRestaurantReviews).mockReturnValue({
    data: { reviews: [mockReview], total: 1, totalPages: 1 },
    isLoading: false,
    isError: false,
    error: null,
  } as ReturnType<typeof useRestaurantReviews>)
  vi.mocked(useUserReview).mockReturnValue({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  } as ReturnType<typeof useUserReview>)
})

describe('RestaurantDetailPage', () => {
  it('shows a loading skeleton when restaurant is loading', () => {
    vi.mocked(useRestaurant).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useRestaurant>)
    renderPage()
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })

  it('shows the restaurant name when loaded', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Pita Pockets' })).toBeInTheDocument()
  })

  it('renders the location map', () => {
    renderPage()
    expect(screen.getByTestId('location-map')).toBeInTheDocument()
  })

  it('shows "Leave a Review" when user has no existing review', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /leave a review/i })).toBeInTheDocument()
  })

  it('shows "Edit Your Review" when user already has a review', () => {
    vi.mocked(useUserReview).mockReturnValue({
      data: { id: 'rv1', user_id: 'u1', restaurant_id: 'rest-1', score: 8, comment: null, created_at: '', updated_at: '' },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useUserReview>)
    renderPage()
    expect(screen.getByRole('link', { name: /edit your review/i })).toBeInTheDocument()
  })

  it('shows the community reviews section heading', () => {
    renderPage()
    expect(screen.getByText(/community reviews/i)).toBeInTheDocument()
  })

  it('renders review cards for community reviews', () => {
    renderPage()
    expect(screen.getByText('Delicious!')).toBeInTheDocument()
  })

  it('shows empty state when there are no reviews', () => {
    vi.mocked(useRestaurantReviews).mockReturnValue({
      data: { reviews: [] as ReviewWithProfile[], total: 0, totalPages: 0 },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useRestaurantReviews>)
    renderPage()
    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument()
  })

  it('hides review cards while reviews are loading', () => {
    vi.mocked(useRestaurantReviews).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useRestaurantReviews>)
    renderPage()
    // review cards not yet rendered
    expect(screen.queryByText('Delicious!')).not.toBeInTheDocument()
  })

  it('shows pagination when there are multiple pages of reviews', () => {
    vi.mocked(useRestaurantReviews).mockReturnValue({
      data: { reviews: [mockReview], total: 30, totalPages: 3 },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useRestaurantReviews>)
    renderPage()
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
  })

  it('shows a not-found message when the restaurant errors', () => {
    vi.mocked(useRestaurant).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Not found'),
    } as ReturnType<typeof useRestaurant>)
    renderPage()
    expect(screen.getByText('Restaurant not found')).toBeInTheDocument()
  })
})
