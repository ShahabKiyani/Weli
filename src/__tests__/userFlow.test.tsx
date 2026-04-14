/**
 * T-064 — End-to-end smoke test.
 * Verifies the complete user flow: sign-in → username → discover → detail →
 * leave review → dashboard → edit review → delete review → sign out.
 *
 * Each describe block covers one major step.  All external data hooks are mocked
 * so the tests run in JSDOM without a live backend.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Pages
import LoginPage from '@/pages/LoginPage'
import SetupUsernamePage from '@/pages/SetupUsernamePage'
import DashboardPage from '@/pages/DashboardPage'
import DiscoverPage from '@/pages/DiscoverPage'
import RestaurantDetailPage from '@/pages/RestaurantDetailPage'
import ReviewFormPage from '@/pages/ReviewFormPage'

// Context / hooks mocked at the module level
import { useAuth } from '@/contexts/AuthContext'
import { useMyReviews } from '@/hooks/useMyReviews'
import { useMyStats } from '@/hooks/useMyStats'
import { useRestaurants } from '@/hooks/useRestaurants'
import { useCuisines } from '@/hooks/useCuisines'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useRestaurantReviews } from '@/hooks/useRestaurantReviews'
import { useUserReview } from '@/hooks/useUserReview'
import { useSubmitReview } from '@/hooks/useSubmitReview'
import { useUpdateReview } from '@/hooks/useUpdateReview'
import { useDeleteReview } from '@/hooks/useDeleteReview'
import { useFriends } from '@/hooks/useFriends'

import type { AuthContextValue } from '@/contexts/AuthContext'
import type {
  ReviewWithRestaurant,
  RestaurantStats,
  RestaurantWithDistance,
  ReviewWithProfile,
  Review,
} from '@/types/database.types'
import type { User } from '@supabase/supabase-js'

// ── Mock all data dependencies ────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('@/hooks/useMyReviews', () => ({ useMyReviews: vi.fn() }))
vi.mock('@/hooks/useMyStats', () => ({ useMyStats: vi.fn() }))
vi.mock('@/hooks/useRestaurants', () => ({ useRestaurants: vi.fn() }))
vi.mock('@/hooks/useCuisines', () => ({ useCuisines: vi.fn() }))
vi.mock('@/hooks/useGeolocation', () => ({ useGeolocation: vi.fn() }))
vi.mock('@/hooks/useRestaurant', () => ({ useRestaurant: vi.fn() }))
vi.mock('@/hooks/useRestaurantReviews', () => ({ useRestaurantReviews: vi.fn() }))
vi.mock('@/hooks/useUserReview', () => ({ useUserReview: vi.fn() }))
vi.mock('@/hooks/useSubmitReview', () => ({ useSubmitReview: vi.fn() }))
vi.mock('@/hooks/useUpdateReview', () => ({ useUpdateReview: vi.fn() }))
vi.mock('@/hooks/useDeleteReview', () => ({ useDeleteReview: vi.fn() }))
vi.mock('@/hooks/useFriends', () => ({ useFriends: vi.fn() }))
vi.mock('@/hooks/usePlacesSearch', () => ({
  usePlacesSearch: () => ({
    results: [],
    isSearching: false,
    error: null,
    search: vi.fn(),
    clear: vi.fn(),
  }),
}))
vi.mock('@/hooks/useImportRestaurant', () => ({
  useImportRestaurant: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
  }),
}))

const mockShowToast = vi.fn()
vi.mock('@/components/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast, toasts: [], dismissToast: vi.fn() }),
  ToastProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Map: ({ children }: { children?: ReactNode }) => <div data-testid="google-map">{children}</div>,
  AdvancedMarker: ({ children, title, onClick }: { children?: ReactNode; title?: string; onClick?: () => void }) => (
    <div data-testid={`marker-${title}`} onClick={onClick}>{children}</div>
  ),
  InfoWindow: ({ children, onCloseClick }: { children?: ReactNode; onCloseClick?: () => void }) => (
    <div data-testid="info-window">
      <button onClick={onCloseClick} aria-label="Close info window">×</button>
      {children}
    </div>
  ),
  useApiLoadingStatus: () => 'LOADED',
}))

vi.mock('@/hooks/useMapAuthError', () => ({
  useMapAuthError: () => false,
}))

// ── Shared fixtures ───────────────────────────────────────────────────────────

const RESTAURANT_ID = 'rest-smoke'

const mockUser = { id: 'u1', email: 'smoke@test.com' } as unknown as User

const mockRestaurant: RestaurantStats = {
  id: RESTAURANT_ID,
  name: 'Smoke Shack',
  cuisine_type: 'BBQ',
  avg_score: 9.0,
  review_count: 12,
  address: '10 Maple Ave',
  lat: 42.37,
  lng: -72.52,
  google_place_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as unknown as RestaurantStats

const mockRestaurantForDiscover: RestaurantWithDistance = {
  ...mockRestaurant,
  latitude: 42.37,
  longitude: -72.52,
} as unknown as RestaurantWithDistance

const mockReviewWithRestaurant: ReviewWithRestaurant = {
  id: 'rv1',
  user_id: 'u1',
  restaurant_id: RESTAURANT_ID,
  score: 9,
  comment: 'Awesome BBQ!',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
  restaurants: { id: RESTAURANT_ID, name: 'Smoke Shack', cuisine_type: 'BBQ' },
} as unknown as ReviewWithRestaurant

const mockUserReview: Review = {
  id: 'rv1',
  user_id: 'u1',
  restaurant_id: RESTAURANT_ID,
  score: 9,
  comment: 'Awesome BBQ!',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
}

const mockPublicReview: ReviewWithProfile = {
  ...mockUserReview,
  profiles: { username: 'smokefan', avatar_url: null },
} as unknown as ReviewWithProfile

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: mockUser,
    profile: { id: 'u1', username: 'smoker', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' } as AuthContextValue['profile'],
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

function makeMutation(mutateAsync = vi.fn().mockResolvedValue(undefined)) {
  return { mutateAsync, isPending: false, isError: false, isIdle: true, isSuccess: false, error: null, data: undefined, mutate: vi.fn(), reset: vi.fn(), variables: undefined, status: 'idle' as const, submittedAt: 0, failureCount: 0, failureReason: null }
}

function setupDefaultMocks() {
  vi.mocked(useAuth).mockReturnValue(makeAuth())
  vi.mocked(useMyReviews).mockReturnValue({ data: { reviews: [mockReviewWithRestaurant], total: 1, totalPages: 1 }, isLoading: false, isError: false, error: null } as ReturnType<typeof useMyReviews>)
  vi.mocked(useMyStats).mockReturnValue({ data: { reviewCount: 1, avgScore: 9.0 }, isLoading: false, isError: false, error: null } as ReturnType<typeof useMyStats>)
  vi.mocked(useRestaurants).mockReturnValue({ data: { restaurants: [mockRestaurantForDiscover], allRestaurants: [mockRestaurantForDiscover], total: 1, totalPages: 1 }, isLoading: false } as ReturnType<typeof useRestaurants>)
  vi.mocked(useCuisines).mockReturnValue({ data: ['BBQ'], isLoading: false } as ReturnType<typeof useCuisines>)
  vi.mocked(useGeolocation).mockReturnValue({ lat: null, lng: null, loading: false, denied: false, error: null, request: vi.fn() })
  vi.mocked(useRestaurant).mockReturnValue({ data: mockRestaurant, isLoading: false, isError: false, error: null } as ReturnType<typeof useRestaurant>)
  vi.mocked(useRestaurantReviews).mockReturnValue({ data: { reviews: [mockPublicReview], total: 1, totalPages: 1 }, isLoading: false, isError: false, error: null } as ReturnType<typeof useRestaurantReviews>)
  vi.mocked(useUserReview).mockReturnValue({ data: null, isLoading: false, isError: false, error: null } as ReturnType<typeof useUserReview>)
  vi.mocked(useSubmitReview).mockReturnValue(makeMutation() as unknown as ReturnType<typeof useSubmitReview>)
  vi.mocked(useUpdateReview).mockReturnValue(makeMutation() as unknown as ReturnType<typeof useUpdateReview>)
  vi.mocked(useDeleteReview).mockReturnValue(makeMutation() as unknown as ReturnType<typeof useDeleteReview>)
  vi.mocked(useFriends).mockReturnValue({ data: [], isLoading: false, isError: false, error: null } as ReturnType<typeof useFriends>)
}

function renderApp(initialPath: string) {
  const qc = new QueryClient()
  return {
    ...render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup-username" element={<SetupUsernamePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/restaurants" element={<DiscoverPage />} />
            <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
            <Route path="/restaurants/:id/review" element={<ReviewFormPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
    qc,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  mockShowToast.mockClear()
  localStorage.clear()
  setupDefaultMocks()
})

// ── Smoke Tests ───────────────────────────────────────────────────────────────

describe('T-064 — Complete user flow smoke tests', () => {

  describe('Step 1: Login', () => {
    it('login page renders with a Google sign-in button', () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth({ isAuthenticated: false, state: { status: 'unauthenticated' } as AuthContextValue['state'] }))
      renderApp('/login')
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
    })

    it('login page calls signInWithGoogle when the button is clicked', async () => {
      const signInWithGoogle = vi.fn()
      vi.mocked(useAuth).mockReturnValue(makeAuth({ isAuthenticated: false, signInWithGoogle, state: { status: 'unauthenticated' } as AuthContextValue['state'] }))
      renderApp('/login')
      await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }))
      expect(signInWithGoogle).toHaveBeenCalledOnce()
    })
  })

  describe('Step 2: Username setup', () => {
    it('setup-username page renders the username input', () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth({ isAuthenticated: true, needsUsername: true, state: { status: 'needs_username' } as AuthContextValue['state'] }))
      renderApp('/setup-username')
      expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument()
    })
  })

  describe('Step 3: Dashboard', () => {
    it('dashboard renders a personalised greeting', () => {
      renderApp('/dashboard')
      expect(screen.getByRole('heading', { name: /@smoker/i })).toBeInTheDocument()
    })

    it('dashboard shows the UserStatsCard', () => {
      renderApp('/dashboard')
      expect(screen.getByText(/avg score/i)).toBeInTheDocument()
    })

    it('dashboard shows the user\'s reviews', () => {
      renderApp('/dashboard')
      expect(screen.getByText('Smoke Shack')).toBeInTheDocument()
    })
  })

  describe('Step 4: Discover — list view', () => {
    it('discover page renders the filter bar with cuisine chips', () => {
      renderApp('/restaurants')
      expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument()
    })

    it('discover page shows restaurant cards', () => {
      renderApp('/restaurants')
      expect(screen.getByText('Smoke Shack')).toBeInTheDocument()
    })

    it('clicking the map view toggle switches to map view', async () => {
      renderApp('/restaurants')
      await userEvent.click(screen.getByRole('button', { name: /map view/i }))
      expect(screen.getByTestId('google-map')).toBeInTheDocument()
    })
  })

  describe('Step 5: Restaurant detail', () => {
    it('restaurant detail page shows the restaurant name', () => {
      renderApp(`/restaurants/${RESTAURANT_ID}`)
      expect(screen.getByRole('heading', { name: /smoke shack/i })).toBeInTheDocument()
    })

    it('restaurant detail page shows a "Leave a Review" action', () => {
      renderApp(`/restaurants/${RESTAURANT_ID}`)
      expect(screen.getByRole('link', { name: /leave a review/i })).toBeInTheDocument()
    })

    it('restaurant detail page shows community reviews', () => {
      renderApp(`/restaurants/${RESTAURANT_ID}`)
      expect(screen.getByText('Awesome BBQ!')).toBeInTheDocument()
    })
  })

  describe('Step 6: Leave a review', () => {
    it('review form page renders the ScoreSelector', () => {
      renderApp(`/restaurants/${RESTAURANT_ID}/review`)
      expect(screen.getByRole('group', { name: /score selector/i })).toBeInTheDocument()
    })

    it('submitting a review navigates back to restaurant detail', async () => {
      renderApp(`/restaurants/${RESTAURANT_ID}/review`)
      await userEvent.click(screen.getByRole('radio', { name: /^9\b/ }))
      await userEvent.click(screen.getByRole('button', { name: /submit review/i }))
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: /smoke shack/i })).toBeInTheDocument(),
      )
    })
  })

  describe('Step 7: Edit review', () => {
    it('review form pre-fills score when user has an existing review', async () => {
      vi.mocked(useUserReview).mockReturnValue({ data: mockUserReview, isLoading: false, isError: false, error: null } as ReturnType<typeof useUserReview>)
      renderApp(`/restaurants/${RESTAURANT_ID}/review`)
      await waitFor(() =>
        expect(screen.getByRole('radio', { name: /^9\b/ })).toHaveAttribute('aria-checked', 'true'),
      )
    })

    it('review form shows "Update Review" button in edit mode', async () => {
      vi.mocked(useUserReview).mockReturnValue({ data: mockUserReview, isLoading: false, isError: false, error: null } as ReturnType<typeof useUserReview>)
      renderApp(`/restaurants/${RESTAURANT_ID}/review`)
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /update review/i })).toBeInTheDocument(),
      )
    })
  })

  describe('Step 8: Delete review', () => {
    it('delete flow: ConfirmModal appears and delete mutation is called', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useUserReview).mockReturnValue({ data: mockUserReview, isLoading: false, isError: false, error: null } as ReturnType<typeof useUserReview>)
      vi.mocked(useDeleteReview).mockReturnValue(makeMutation(mutateAsync) as unknown as ReturnType<typeof useDeleteReview>)
      renderApp(`/restaurants/${RESTAURANT_ID}/review`)
      await waitFor(() => screen.getByRole('button', { name: /delete review/i }))
      await userEvent.click(screen.getByRole('button', { name: /delete review/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }))
      await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce())
    })
  })

  describe('Step 9: Sign out', () => {
    it('sign out navigates to the login page', async () => {
      // When signOut is called, flip the auth mock to unauthenticated so
      // LoginPage does not immediately redirect back to /dashboard
      const signOut = vi.fn().mockImplementation(async () => {
        vi.mocked(useAuth).mockReturnValue(
          makeAuth({
            isAuthenticated: false,
            user: null,
            profile: null,
            signOut,
            state: { status: 'unauthenticated' } as AuthContextValue['state'],
          }),
        )
      })
      vi.mocked(useAuth).mockReturnValue(makeAuth({ signOut }))
      renderApp('/dashboard')
      await userEvent.click(screen.getByRole('button', { name: /user menu/i }))
      await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }))
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument(),
      )
    })
  })
})
