import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ActionRow } from '@/components/ActionRow'

function renderRow(hasReview: boolean, loading = false) {
  return render(
    <MemoryRouter>
      <ActionRow restaurantId="rest-1" hasReview={hasReview} loading={loading} />
    </MemoryRouter>,
  )
}

describe('ActionRow', () => {
  it('shows "Leave a Review" when the user has no review', () => {
    renderRow(false)
    expect(screen.getByRole('link', { name: /leave a review/i })).toBeInTheDocument()
  })

  it('shows "Edit Your Review" when the user already has a review', () => {
    renderRow(true)
    expect(screen.getByRole('link', { name: /edit your review/i })).toBeInTheDocument()
  })

  it('"Leave a Review" link points to /restaurants/:id/review', () => {
    renderRow(false)
    expect(screen.getByRole('link', { name: /leave a review/i })).toHaveAttribute(
      'href',
      '/restaurants/rest-1/review',
    )
  })

  it('"Edit Your Review" link points to /restaurants/:id/review', () => {
    renderRow(true)
    expect(screen.getByRole('link', { name: /edit your review/i })).toHaveAttribute(
      'href',
      '/restaurants/rest-1/review',
    )
  })

  it('shows a loading skeleton when loading=true', () => {
    renderRow(false, true)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
