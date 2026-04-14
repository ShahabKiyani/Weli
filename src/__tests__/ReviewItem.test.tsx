import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ReviewItem } from '@/components/ReviewItem'
import type { ReviewWithRestaurant } from '@/types/database.types'

const mockReview: ReviewWithRestaurant = {
  id: 'r1',
  user_id: 'u1',
  restaurant_id: 'rest1',
  score: 8,
  comment: 'Really great pita bread. Would definitely come back!',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
  restaurants: {
    id: 'rest1',
    name: 'Pita Pockets',
    cuisine_type: 'Mediterranean',
  },
}

function renderItem(review = mockReview) {
  return render(
    <MemoryRouter>
      <ReviewItem review={review} />
    </MemoryRouter>,
  )
}

describe('ReviewItem', () => {
  it('renders the restaurant name', () => {
    renderItem()
    expect(screen.getByText('Pita Pockets')).toBeInTheDocument()
  })

  it('renders the restaurant name as a link to /restaurants/:id', () => {
    renderItem()
    const link = screen.getByRole('link', { name: 'Pita Pockets' })
    expect(link).toHaveAttribute('href', '/restaurants/rest1')
  })

  it('renders the cuisine type', () => {
    renderItem()
    expect(screen.getByText('Mediterranean')).toBeInTheDocument()
  })

  it('renders a score badge with the correct score', () => {
    renderItem()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('renders the comment text', () => {
    renderItem()
    expect(screen.getByText(/really great pita bread/i)).toBeInTheDocument()
  })

  it('shows "No comment" when comment is null', () => {
    renderItem({ ...mockReview, comment: null })
    expect(screen.getByText(/no comment/i)).toBeInTheDocument()
  })

  it('renders a time element with a dateTime attribute', () => {
    renderItem()
    const timeEl = screen.getByRole('time')
    expect(timeEl).toBeInTheDocument()
    expect(timeEl).toHaveAttribute('dateTime', '2026-01-15T10:00:00Z')
  })

  it('renders a relative date string inside the time element', () => {
    renderItem()
    // formatDistanceToNow produces something like "about X months ago"
    expect(screen.getByRole('time').textContent).toMatch(/ago/i)
  })
})
