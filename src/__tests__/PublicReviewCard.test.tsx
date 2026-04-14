import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PublicReviewCard } from '@/components/PublicReviewCard'
import type { ReviewWithProfile } from '@/types/database.types'

const mockReview: ReviewWithProfile = {
  id: 'rv1',
  user_id: 'u1',
  restaurant_id: 'rest-1',
  score: 7,
  comment: 'Really enjoyed the atmosphere!',
  created_at: '2026-03-01T10:00:00Z',
  updated_at: '2026-03-01T10:00:00Z',
  profiles: {
    username: 'amherst_foodie',
    avatar_url: 'https://example.com/avatar.jpg',
  },
}

describe('PublicReviewCard', () => {
  it('renders the username with @ prefix', () => {
    render(<PublicReviewCard review={mockReview} />)
    expect(screen.getByText(/@amherst_foodie/i)).toBeInTheDocument()
  })

  it('renders the score badge', () => {
    render(<PublicReviewCard review={mockReview} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders the comment text', () => {
    render(<PublicReviewCard review={mockReview} />)
    expect(screen.getByText(/really enjoyed the atmosphere/i)).toBeInTheDocument()
  })

  it('shows "No comment" when comment is null', () => {
    render(<PublicReviewCard review={{ ...mockReview, comment: null }} />)
    expect(screen.getByText(/no comment/i)).toBeInTheDocument()
  })

  it('renders a time element with dateTime attribute', () => {
    render(<PublicReviewCard review={mockReview} />)
    const timeEl = screen.getByRole('time')
    expect(timeEl).toHaveAttribute('dateTime', '2026-03-01T10:00:00Z')
  })

  it('shows a relative date string', () => {
    render(<PublicReviewCard review={mockReview} />)
    expect(screen.getByRole('time').textContent).toMatch(/ago/i)
  })

  it('renders the avatar image when avatar_url is set', () => {
    render(<PublicReviewCard review={mockReview} />)
    expect(screen.getByRole('img', { name: /amherst_foodie/i })).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg',
    )
  })

  it('renders an initial letter when avatar_url is null', () => {
    render(
      <PublicReviewCard
        review={{ ...mockReview, profiles: { username: 'tester', avatar_url: null } }}
      />,
    )
    // 'tester' → 'T'
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('shows "Unknown" as fallback when profiles is null', () => {
    render(<PublicReviewCard review={{ ...mockReview, profiles: null }} />)
    expect(screen.getByText(/unknown/i)).toBeInTheDocument()
  })
})
