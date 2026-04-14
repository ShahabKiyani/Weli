import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { RestaurantLocationMap } from '@/components/RestaurantLocationMap'
import type { RestaurantStats } from '@/types/database.types'

let mockApiStatus = 'LOADED'
vi.mock('@vis.gl/react-google-maps', () => ({
  Map: ({ children }: { children?: ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  AdvancedMarker: ({ title }: { title?: string }) => (
    <div data-testid={`marker-${title}`} />
  ),
  useApiLoadingStatus: () => mockApiStatus,
}))

vi.mock('@/hooks/useMapAuthError', () => ({
  useMapAuthError: () => false,
}))

const mockRestaurant: RestaurantStats = {
  id: 'rest-1',
  name: 'Pita Pockets',
  address: '1 Main St',
  latitude: 42.3732,
  longitude: -72.5199,
  cuisine_type: 'Mediterranean',
  description: null,
  image_url: null,
  phone: null,
  website: null,
  google_place_id: 'gplace_abc',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  avg_score: 8,
  review_count: 5,
}

describe('RestaurantLocationMap', () => {
  beforeEach(() => {
    mockApiStatus = 'LOADED'
  })

  it('renders a map container', () => {
    render(<RestaurantLocationMap restaurant={mockRestaurant} />)
    expect(screen.getByTestId('google-map')).toBeInTheDocument()
  })

  it('renders a single marker for the restaurant', () => {
    render(<RestaurantLocationMap restaurant={mockRestaurant} />)
    expect(screen.getByTestId('marker-Pita Pockets')).toBeInTheDocument()
  })

  it('renders a "Get Directions" link', () => {
    render(<RestaurantLocationMap restaurant={mockRestaurant} />)
    expect(screen.getByRole('link', { name: /get directions/i })).toBeInTheDocument()
  })

  it('"Get Directions" link points to Google Maps with the restaurant address', () => {
    render(<RestaurantLocationMap restaurant={mockRestaurant} />)
    const link = screen.getByRole('link', { name: /get directions/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('google.com/maps'))
    // Address should be URL-encoded in the destination param
    expect(link).toHaveAttribute('href', expect.stringContaining('destination='))
  })

  it('"Get Directions" link includes destination_place_id when google_place_id is set', () => {
    render(<RestaurantLocationMap restaurant={mockRestaurant} />)
    const link = screen.getByRole('link', { name: /get directions/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('gplace_abc'))
  })

  it('"Get Directions" link omits destination_place_id when google_place_id is null', () => {
    render(
      <RestaurantLocationMap restaurant={{ ...mockRestaurant, google_place_id: null }} />,
    )
    const link = screen.getByRole('link', { name: /get directions/i })
    expect(link).not.toHaveAttribute('href', expect.stringContaining('destination_place_id'))
  })

  it('"Get Directions" link opens in a new tab', () => {
    render(<RestaurantLocationMap restaurant={mockRestaurant} />)
    expect(screen.getByRole('link', { name: /get directions/i })).toHaveAttribute(
      'target',
      '_blank',
    )
  })

  it('shows fallback when API status is FAILED', () => {
    mockApiStatus = 'FAILED'
    render(<RestaurantLocationMap restaurant={mockRestaurant} />)
    expect(screen.queryByTestId('google-map')).not.toBeInTheDocument()
    expect(screen.getByText(/map unavailable/i)).toBeInTheDocument()
  })

  it('shows fallback when API status is AUTH_FAILURE', () => {
    mockApiStatus = 'AUTH_FAILURE'
    render(<RestaurantLocationMap restaurant={mockRestaurant} />)
    expect(screen.queryByTestId('google-map')).not.toBeInTheDocument()
    expect(screen.getByText(/map unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(mockRestaurant.name)).toBeInTheDocument()
  })
})
