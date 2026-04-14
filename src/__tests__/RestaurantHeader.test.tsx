import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RestaurantHeader } from '@/components/RestaurantHeader'
import type { RestaurantStats } from '@/types/database.types'

const mockRestaurant: RestaurantStats = {
  id: 'rest-1',
  name: 'Pita Pockets',
  address: '1 Main St, Amherst, MA',
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
  avg_score: 8.4,
  review_count: 22,
}

describe('RestaurantHeader', () => {
  it('shows a loading skeleton when loading=true', () => {
    render(<RestaurantHeader restaurant={undefined} loading={true} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Pita Pockets')).not.toBeInTheDocument()
  })

  it('renders the restaurant name', () => {
    render(<RestaurantHeader restaurant={mockRestaurant} loading={false} />)
    expect(screen.getByRole('heading', { name: 'Pita Pockets' })).toBeInTheDocument()
  })

  it('renders the address', () => {
    render(<RestaurantHeader restaurant={mockRestaurant} loading={false} />)
    expect(screen.getByText('1 Main St, Amherst, MA')).toBeInTheDocument()
  })

  it('renders the cuisine type as a chip', () => {
    render(<RestaurantHeader restaurant={mockRestaurant} loading={false} />)
    expect(screen.getByText('Mediterranean')).toBeInTheDocument()
  })

  it('renders the rounded avg_score prominently', () => {
    render(<RestaurantHeader restaurant={mockRestaurant} loading={false} />)
    // avg_score 8.4 → display "8.4" or "8" — we show the raw value with /10
    expect(screen.getByText('8.4')).toBeInTheDocument()
  })

  it('renders the review count', () => {
    render(<RestaurantHeader restaurant={mockRestaurant} loading={false} />)
    expect(screen.getByText(/22/)).toBeInTheDocument()
  })

  it('shows "/ 10" label next to the score', () => {
    render(<RestaurantHeader restaurant={mockRestaurant} loading={false} />)
    expect(screen.getByText(/\/\s*10/)).toBeInTheDocument()
  })
})
