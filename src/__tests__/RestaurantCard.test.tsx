import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { RestaurantCard } from '@/components/RestaurantCard'
import type { RestaurantWithDistance } from '@/types/database.types'

const mockRestaurant: RestaurantWithDistance = {
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
  distanceKm: 0.3,
}

function renderCard(props?: Partial<{ highlighted: boolean; onMouseEnter: () => void; onMouseLeave: () => void }>) {
  return render(
    <MemoryRouter>
      <RestaurantCard restaurant={mockRestaurant} {...props} />
    </MemoryRouter>,
  )
}

describe('RestaurantCard', () => {
  it('renders the restaurant name', () => {
    renderCard()
    expect(screen.getByText('Pita Pockets')).toBeInTheDocument()
  })

  it('links to /restaurants/:id', () => {
    renderCard()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/restaurants/rest-1')
  })

  it('shows the cuisine type', () => {
    renderCard()
    expect(screen.getByText('Mediterranean')).toBeInTheDocument()
  })

  it('renders the score badge with rounded avg_score', () => {
    renderCard()
    // avg_score 8.2 → rounds to 8
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('shows formatted distance when distanceKm is defined', () => {
    renderCard()
    expect(screen.getByText('300m')).toBeInTheDocument()
  })

  it('shows "—" when distanceKm is undefined', () => {
    render(
      <MemoryRouter>
        <RestaurantCard restaurant={{ ...mockRestaurant, distanceKm: undefined }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('applies a highlighted visual indicator when highlighted=true', () => {
    renderCard({ highlighted: true })
    // The card root should have a data attribute or class indicating highlight
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('data-highlighted', 'true')
  })

  it('does not have highlighted indicator by default', () => {
    renderCard()
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('data-highlighted', 'false')
  })

  it('calls onMouseEnter when hovered', async () => {
    const onMouseEnter = vi.fn()
    renderCard({ onMouseEnter })
    await userEvent.hover(screen.getByRole('article'))
    expect(onMouseEnter).toHaveBeenCalled()
  })

  it('calls onMouseLeave when un-hovered', async () => {
    const onMouseLeave = vi.fn()
    renderCard({ onMouseLeave })
    await userEvent.unhover(screen.getByRole('article'))
    expect(onMouseLeave).toHaveBeenCalled()
  })
})
