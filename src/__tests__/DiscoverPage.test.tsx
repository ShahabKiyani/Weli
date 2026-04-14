import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DiscoverPage from '@/pages/DiscoverPage'
import { useAuth } from '@/contexts/AuthContext'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useRestaurants } from '@/hooks/useRestaurants'
import { useCuisines } from '@/hooks/useCuisines'
import { ToastProvider } from '@/components/Toast'
import type { AuthContextValue } from '@/contexts/AuthContext'
import type { RestaurantWithDistance } from '@/types/database.types'

vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/useGeolocation')
vi.mock('@/hooks/useRestaurants')
vi.mock('@/hooks/useCuisines')

// We need to control searchFn to test auto-trigger
const mockSearch = vi.fn()
const mockClear = vi.fn()

vi.mock('@/hooks/usePlacesSearch', () => ({
  usePlacesSearch: () => ({
    results: [],
    isSearching: false,
    error: null,
    search: mockSearch,
    clear: mockClear,
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
vi.mock('@/components/RestaurantMap', () => ({
  RestaurantMap: ({ restaurants }: { restaurants: RestaurantWithDistance[] }) => (
    <div data-testid="restaurant-map">
      {restaurants.map((r) => (
        <div key={r.id}>{r.name}</div>
      ))}
    </div>
  ),
}))

// Mock useDebounce to be synchronous (pass-through) for most tests so we
// can test the debounced behavior without fake timers in every single test.
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: <T,>(value: T) => value,
}))

const mockRestaurant: RestaurantWithDistance = {
  id: 'r1',
  name: 'Pita Pockets',
  address: '1 Main St',
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
  avg_score: 8,
  review_count: 5,
}

function makeAuth(): AuthContextValue {
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
  }
}

function makeGeo(overrides = {}) {
  return {
    lat: null,
    lng: null,
    loading: false,
    error: null,
    denied: false,
    request: vi.fn(),
    ...overrides,
  }
}

function makeRestaurantsData(overrides = {}) {
  return {
    data: {
      restaurants: [mockRestaurant],
      allRestaurants: [mockRestaurant],
      total: 1,
      totalPages: 1,
    },
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  } as ReturnType<typeof useRestaurants>
}

function renderPage() {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/restaurants']}>
        <ToastProvider>
          <Routes>
            <Route path="/restaurants" element={<DiscoverPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  vi.mocked(useAuth).mockReturnValue(makeAuth())
  vi.mocked(useGeolocation).mockReturnValue(makeGeo())
  vi.mocked(useRestaurants).mockReturnValue(makeRestaurantsData())
  vi.mocked(useCuisines).mockReturnValue({ data: ['Mediterranean', 'American'], isLoading: false } as ReturnType<typeof useCuisines>)
})

describe('DiscoverPage', () => {
  it('shows the LocationPrompt when no location, not denied, not dismissed', () => {
    renderPage()
    expect(screen.getByText(/enable location/i)).toBeInTheDocument()
  })

  it('hides LocationPrompt when location is already granted (lat available)', () => {
    vi.mocked(useGeolocation).mockReturnValue(makeGeo({ lat: 42.37, lng: -72.52 }))
    renderPage()
    expect(screen.queryByText(/enable location/i)).not.toBeInTheDocument()
  })

  it('hides LocationPrompt when permission was denied', () => {
    vi.mocked(useGeolocation).mockReturnValue(makeGeo({ denied: true }))
    renderPage()
    expect(screen.queryByText(/enable location/i)).not.toBeInTheDocument()
  })

  it('hides LocationPrompt after dismiss is clicked', async () => {
    renderPage()
    const dismissBtn = screen.getByRole('button', { name: /dismiss location prompt/i })
    await userEvent.click(dismissBtn)
    expect(screen.queryByText(/enable location/i)).not.toBeInTheDocument()
  })

  it('calls geo request() when Allow is clicked', async () => {
    const request = vi.fn()
    vi.mocked(useGeolocation).mockReturnValue(makeGeo({ request }))
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /allow/i }))
    expect(request).toHaveBeenCalledOnce()
  })

  it('renders restaurant cards in list view', () => {
    renderPage()
    expect(screen.getByText('Pita Pockets')).toBeInTheDocument()
  })

  it('shows skeleton loaders while restaurants are loading', () => {
    vi.mocked(useRestaurants).mockReturnValue(makeRestaurantsData({ isLoading: true, data: undefined }))
    renderPage()
    expect(screen.queryByText('Pita Pockets')).not.toBeInTheDocument()
  })

  it('shows empty state when no restaurants match the filter', () => {
    vi.mocked(useRestaurants).mockReturnValue(
      makeRestaurantsData({
        data: { restaurants: [], allRestaurants: [], total: 0, totalPages: 0 },
      }),
    )
    renderPage()
    expect(screen.getByText(/no restaurants/i)).toBeInTheDocument()
  })

  it('switches to map view when Map view button is clicked', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /map view/i }))
    expect(screen.getByTestId('restaurant-map')).toBeInTheDocument()
  })

  it('switches back to list view when List view button is clicked', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /map view/i }))
    await userEvent.click(screen.getByRole('button', { name: /list view/i }))
    expect(screen.getByText('Pita Pockets')).toBeInTheDocument()
    expect(screen.queryByTestId('restaurant-map')).not.toBeInTheDocument()
  })

  it('shows pagination when totalPages > 1', () => {
    vi.mocked(useRestaurants).mockReturnValue(
      makeRestaurantsData({ data: { restaurants: [mockRestaurant], allRestaurants: [mockRestaurant], total: 25, totalPages: 3 } }),
    )
    renderPage()
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
  })

  // ── Auto-populate Google Places (Phase 11) ─────────────────────────────────

  it('does NOT render a "Search Google Maps" button at any point', async () => {
    renderPage()
    // Type a query that would have shown the old manual button
    const searchInput = screen.getByRole('searchbox', { name: /search restaurants/i })
    await userEvent.type(searchInput, 'ramen')
    expect(screen.queryByRole('button', { name: /search google maps/i })).not.toBeInTheDocument()
  })

  it('auto-calls searchPlaces when debounced query is >= 2 characters', async () => {
    renderPage()
    const searchInput = screen.getByRole('searchbox', { name: /search restaurants/i })
    await act(async () => {
      await userEvent.type(searchInput, 'ra')
    })
    expect(mockSearch).toHaveBeenCalledWith('ra')
  })

  it('auto-calls searchPlaces with trimmed query', async () => {
    renderPage()
    const searchInput = screen.getByRole('searchbox', { name: /search restaurants/i })
    await act(async () => {
      await userEvent.type(searchInput, '  ramen  ')
    })
    expect(mockSearch).toHaveBeenCalledWith('ramen')
  })

  it('calls clearPlaces when query is cleared (drops below 2 chars)', async () => {
    renderPage()
    const searchInput = screen.getByRole('searchbox', { name: /search restaurants/i })
    await act(async () => {
      await userEvent.type(searchInput, 'ra')
    })
    await act(async () => {
      await userEvent.clear(searchInput)
    })
    expect(mockClear).toHaveBeenCalled()
  })

  it('calls clearPlaces when query drops to 1 character', async () => {
    renderPage()
    const searchInput = screen.getByRole('searchbox', { name: /search restaurants/i })
    await act(async () => {
      await userEvent.type(searchInput, 'ramen')
    })
    mockClear.mockClear()
    // Simulate typing backspaces down to a single char
    await act(async () => {
      await userEvent.clear(searchInput)
      await userEvent.type(searchInput, 'r')
    })
    expect(mockClear).toHaveBeenCalled()
  })

  it('does not show the PlacesResults section when query is shorter than 2 chars', async () => {
    renderPage()
    const searchInput = screen.getByRole('searchbox', { name: /search restaurants/i })
    await userEvent.type(searchInput, 'r')
    // The "From Google Maps" heading only appears when section is visible
    expect(screen.queryByText(/from google maps/i)).not.toBeInTheDocument()
  })
})
