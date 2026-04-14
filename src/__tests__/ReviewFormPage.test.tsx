import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import ReviewFormPage from '@/pages/ReviewFormPage'
import { useAuth } from '@/contexts/AuthContext'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useUserReview } from '@/hooks/useUserReview'
import { useSubmitReview } from '@/hooks/useSubmitReview'
import { useUpdateReview } from '@/hooks/useUpdateReview'
import { useDeleteReview } from '@/hooks/useDeleteReview'
import type { RestaurantStats, Review } from '@/types/database.types'
import type { AuthContextValue } from '@/contexts/AuthContext'
import type { User } from '@supabase/supabase-js'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('@/hooks/useRestaurant', () => ({ useRestaurant: vi.fn() }))
vi.mock('@/hooks/useUserReview', () => ({ useUserReview: vi.fn() }))
vi.mock('@/hooks/useSubmitReview', () => ({ useSubmitReview: vi.fn() }))
vi.mock('@/hooks/useUpdateReview', () => ({ useUpdateReview: vi.fn() }))
vi.mock('@/hooks/useDeleteReview', () => ({ useDeleteReview: vi.fn() }))

const mockShowToast = vi.fn()
vi.mock('@/components/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast, toasts: [], dismissToast: vi.fn() }),
  ToastProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const RESTAURANT_ID = 'rest-abc'

const mockRestaurant = {
  id: RESTAURANT_ID,
  name: 'Pita Pockets',
  cuisine_type: 'Mediterranean',
  avg_score: 8.0,
  review_count: 5,
  address: '1 Main St',
  lat: 42.37,
  lng: -72.52,
  google_place_id: null,
  created_at: '2026-01-01T00:00:00Z',
} as unknown as RestaurantStats

const mockExistingReview = {
  id: 'rv-001',
  restaurant_id: RESTAURANT_ID,
  user_id: 'u1',
  score: 7,
  comment: 'Good vibes',
  created_at: '2026-01-10T00:00:00Z',
  updated_at: '2026-01-10T00:00:00Z',
} as Review

function makeMutation(overrides: Record<string, unknown> = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isError: false,
    isIdle: true,
    isSuccess: false,
    error: null,
    data: undefined,
    mutate: vi.fn(),
    reset: vi.fn(),
    variables: undefined,
    status: 'idle' as const,
    submittedAt: 0,
    failureCount: 0,
    failureReason: null,
    ...overrides,
  }
}

function makeUseQuery<T>(data: T, opts: { isLoading?: boolean } = {}) {
  return { data, isLoading: opts.isLoading ?? false, isError: false, error: null }
}

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: { id: 'u1', email: 'test@test.com' } as unknown as User,
    profile: null,
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

interface RenderOptions {
  submitMutation?: ReturnType<typeof makeMutation>
  updateMutation?: ReturnType<typeof makeMutation>
  deleteMutation?: ReturnType<typeof makeMutation>
  reviewData?: Review | null
  reviewLoading?: boolean
}

function renderPage(opts: RenderOptions = {}) {
  const {
    reviewData = null,
    reviewLoading = false,
    submitMutation = makeMutation(),
    updateMutation = makeMutation(),
    deleteMutation = makeMutation(),
  } = opts

  const qc = new QueryClient()
  vi.mocked(useAuth).mockReturnValue(makeAuth())
  vi.mocked(useRestaurant).mockReturnValue(
    makeUseQuery(mockRestaurant) as ReturnType<typeof useRestaurant>,
  )
  vi.mocked(useUserReview).mockReturnValue(
    makeUseQuery(reviewData, { isLoading: reviewLoading }) as ReturnType<typeof useUserReview>,
  )
  vi.mocked(useSubmitReview).mockReturnValue(
    submitMutation as unknown as ReturnType<typeof useSubmitReview>,
  )
  vi.mocked(useUpdateReview).mockReturnValue(
    updateMutation as unknown as ReturnType<typeof useUpdateReview>,
  )
  vi.mocked(useDeleteReview).mockReturnValue(
    deleteMutation as unknown as ReturnType<typeof useDeleteReview>,
  )

  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/restaurants/${RESTAURANT_ID}/review`]}>
        <Routes>
          <Route path="/restaurants/:id/review" element={<ReviewFormPage />} />
          <Route
            path="/restaurants/:id"
            element={<div data-testid="detail-page">Detail Page</div>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  mockShowToast.mockClear()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ReviewFormPage — create mode', () => {
  it('displays the restaurant name', () => {
    renderPage()
    // The <p> element contains exactly "Pita Pockets" (exact string, not a substring of other text)
    expect(screen.getByText('Pita Pockets')).toBeInTheDocument()
  })

  it('renders the ScoreSelector group', () => {
    renderPage()
    expect(screen.getByRole('group', { name: /score selector/i })).toBeInTheDocument()
  })

  it('renders 10 score buttons', () => {
    renderPage()
    expect(screen.getAllByRole('radio')).toHaveLength(10)
  })

  it('renders a textarea for the comment', () => {
    renderPage()
    expect(screen.getByRole('textbox', { name: /comment/i })).toBeInTheDocument()
  })

  it('shows character count 0/500 initially', () => {
    renderPage()
    expect(screen.getByText('0/500')).toBeInTheDocument()
  })

  it('updates the character count as the user types', async () => {
    renderPage()
    const textarea = screen.getByRole('textbox', { name: /comment/i })
    await userEvent.type(textarea, 'Hello')
    expect(screen.getByText('5/500')).toBeInTheDocument()
  })

  it('submit button is disabled when no score is selected', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /submit review/i })).toBeDisabled()
  })

  it('submit button is enabled after a score is selected', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('radio', { name: /^8\b/ }))
    expect(screen.getByRole('button', { name: /submit review/i })).not.toBeDisabled()
  })

  it('calls submitMutation.mutateAsync with correct data on submit', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    renderPage({ submitMutation: makeMutation({ mutateAsync }) })
    await userEvent.click(screen.getByRole('radio', { name: /^6\b/ }))
    const textarea = screen.getByRole('textbox', { name: /comment/i })
    await userEvent.type(textarea, 'Nice')
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ restaurantId: RESTAURANT_ID, score: 6 }),
      ),
    )
  })

  it('shows "Submit Review" button text in create mode', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument()
  })

  it('navigates to the restaurant detail page on successful submission', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('radio', { name: /^5\b/ }))
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))
    await waitFor(() => expect(screen.getByTestId('detail-page')).toBeInTheDocument())
  })

  it('shows a success toast on successful submission', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('radio', { name: /^5\b/ }))
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success'))
  })

  it('shows an error toast when submitMutation throws', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('DB error'))
    renderPage({ submitMutation: makeMutation({ mutateAsync }) })
    await userEvent.click(screen.getByRole('radio', { name: /^5\b/ }))
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'error'))
  })

  it('does not show the Delete Review button in create mode', () => {
    renderPage()
    expect(screen.queryByRole('button', { name: /delete review/i })).not.toBeInTheDocument()
  })
})

describe('ReviewFormPage — edit mode', () => {
  it('pre-fills the score from the existing review', async () => {
    renderPage({ reviewData: mockExistingReview })
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: /^7\b/ })).toHaveAttribute('aria-checked', 'true'),
    )
  })

  it('pre-fills the comment from the existing review', async () => {
    renderPage({ reviewData: mockExistingReview })
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /comment/i })).toHaveValue('Good vibes'),
    )
  })

  it('shows "Update Review" button text in edit mode', async () => {
    renderPage({ reviewData: mockExistingReview })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /update review/i })).toBeInTheDocument(),
    )
  })

  it('calls updateMutation.mutateAsync on submit in edit mode', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    renderPage({
      reviewData: mockExistingReview,
      updateMutation: makeMutation({ mutateAsync }),
    })
    await waitFor(() => screen.getByRole('button', { name: /update review/i }))
    await userEvent.click(screen.getByRole('button', { name: /update review/i }))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ reviewId: 'rv-001', restaurantId: RESTAURANT_ID }),
      ),
    )
  })

  it('shows a "Delete Review" button in edit mode', async () => {
    renderPage({ reviewData: mockExistingReview })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /delete review/i })).toBeInTheDocument(),
    )
  })

  it('opens ConfirmModal when "Delete Review" is clicked', async () => {
    renderPage({ reviewData: mockExistingReview })
    await waitFor(() => screen.getByRole('button', { name: /delete review/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete review/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the modal when cancel is clicked', async () => {
    renderPage({ reviewData: mockExistingReview })
    await waitFor(() => screen.getByRole('button', { name: /delete review/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete review/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls deleteMutation.mutateAsync when confirm is clicked', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    renderPage({
      reviewData: mockExistingReview,
      deleteMutation: makeMutation({ mutateAsync }),
    })
    await waitFor(() => screen.getByRole('button', { name: /delete review/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete review/i }))
    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ reviewId: 'rv-001', restaurantId: RESTAURANT_ID }),
      ),
    )
  })

  it('navigates to restaurant detail after delete', async () => {
    renderPage({ reviewData: mockExistingReview })
    await waitFor(() => screen.getByRole('button', { name: /delete review/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete review/i }))
    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }))
    await waitFor(() => expect(screen.getByTestId('detail-page')).toBeInTheDocument())
  })

  it('shows textarea char count from pre-filled comment', async () => {
    renderPage({ reviewData: mockExistingReview })
    // "Good vibes" = 10 chars
    await waitFor(() => expect(screen.getByText('10/500')).toBeInTheDocument())
  })
})

describe('ReviewFormPage — loading state', () => {
  it('hides the score selector while checking for existing review', () => {
    renderPage({ reviewLoading: true })
    expect(screen.queryByRole('group', { name: /score selector/i })).not.toBeInTheDocument()
  })
})

