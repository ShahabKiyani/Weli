import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { RestaurantMap } from '@/components/RestaurantMap'
import type { RestaurantWithDistance } from '@/types/database.types'

let mockApiStatus = 'LOADED'
vi.mock('@vis.gl/react-google-maps', () => ({
  Map: ({ children }: { children?: ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  AdvancedMarker: ({
    children,
    title,
    onClick,
  }: {
    children?: ReactNode
    title?: string
    onClick?: () => void
  }) => (
    <div data-testid={`marker-${title}`} onClick={onClick}>
      {children}
    </div>
  ),
  InfoWindow: ({
    children,
    onCloseClick,
  }: {
    children?: ReactNode
    onCloseClick?: () => void
  }) => (
    <div data-testid="info-window">
      <button onClick={onCloseClick} aria-label="Close info window">
        ×
      </button>
      {children}
    </div>
  ),
  useApiLoadingStatus: () => mockApiStatus,
}))

vi.mock('@/hooks/useMapAuthError', () => ({
  useMapAuthError: () => false,
}))

const makeRestaurant = (overrides: Partial<RestaurantWithDistance> = {}): RestaurantWithDistance => ({
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
  ...overrides,
})

function renderMap(
  restaurants: RestaurantWithDistance[],
  props?: Partial<React.ComponentProps<typeof RestaurantMap>>,
) {
  return render(
    <MemoryRouter>
      <RestaurantMap restaurants={restaurants} {...props} />
    </MemoryRouter>,
  )
}

describe('RestaurantMap', () => {
  beforeEach(() => {
    mockApiStatus = 'LOADED'
  })

  it('renders a map container', () => {
    renderMap([])
    expect(screen.getByTestId('google-map')).toBeInTheDocument()
  })

  it('renders a marker for each restaurant', () => {
    const restaurants = [
      makeRestaurant({ id: 'r1', name: 'Pita Pockets' }),
      makeRestaurant({ id: 'r2', name: 'Ziti Zings' }),
    ]
    renderMap(restaurants)
    expect(screen.getByTestId('marker-Pita Pockets')).toBeInTheDocument()
    expect(screen.getByTestId('marker-Ziti Zings')).toBeInTheDocument()
  })

  it('does not show InfoWindow initially', () => {
    renderMap([makeRestaurant()])
    expect(screen.queryByTestId('info-window')).not.toBeInTheDocument()
  })

  it('shows InfoWindow when a marker is clicked', async () => {
    renderMap([makeRestaurant({ name: 'Pita Pockets' })])
    await userEvent.click(screen.getByTestId('marker-Pita Pockets'))
    expect(screen.getByTestId('info-window')).toBeInTheDocument()
  })

  it('shows restaurant name in InfoWindow', async () => {
    renderMap([makeRestaurant({ name: 'Pita Pockets' })])
    await userEvent.click(screen.getByTestId('marker-Pita Pockets'))
    expect(screen.getByText('Pita Pockets')).toBeInTheDocument()
  })

  it('shows cuisine type in InfoWindow', async () => {
    renderMap([makeRestaurant({ cuisine_type: 'Mediterranean' })])
    await userEvent.click(screen.getByTestId('marker-Pita Pockets'))
    expect(screen.getByText('Mediterranean')).toBeInTheDocument()
  })

  it('has a "View Details" link in the InfoWindow linking to /restaurants/:id', async () => {
    renderMap([makeRestaurant({ id: 'r1', name: 'Pita Pockets' })])
    await userEvent.click(screen.getByTestId('marker-Pita Pockets'))
    const link = screen.getByRole('link', { name: /view details/i })
    expect(link).toHaveAttribute('href', '/restaurants/r1')
  })

  it('closes InfoWindow when the close button is clicked', async () => {
    renderMap([makeRestaurant({ name: 'Pita Pockets' })])
    await userEvent.click(screen.getByTestId('marker-Pita Pockets'))
    expect(screen.getByTestId('info-window')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /close info window/i }))
    expect(screen.queryByTestId('info-window')).not.toBeInTheDocument()
  })

  it('applies data-highlighted attribute to the highlighted marker content', () => {
    renderMap([makeRestaurant({ id: 'r1', name: 'Pita Pockets' })], { highlightedId: 'r1' })
    const markerContent = screen.getByTestId('marker-content-r1')
    expect(markerContent).toHaveAttribute('data-highlighted', 'true')
  })

  it('shows fallback for FAILED status', () => {
    mockApiStatus = 'FAILED'
    renderMap([makeRestaurant()])
    expect(screen.queryByTestId('google-map')).not.toBeInTheDocument()
    expect(screen.getByText(/map unavailable/i)).toBeInTheDocument()
  })

  it('shows fallback for AUTH_FAILURE status', () => {
    mockApiStatus = 'AUTH_FAILURE'
    renderMap([makeRestaurant()])
    expect(screen.queryByTestId('google-map')).not.toBeInTheDocument()
    expect(screen.getByText(/map unavailable/i)).toBeInTheDocument()
  })
})
