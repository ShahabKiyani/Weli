import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FeedItem } from '@/components/FeedItem'
import type { FriendFeedEntry } from '@/types/database.types'

const mockEntry: FriendFeedEntry = {
  review_id: 'rv1',
  user_id: 'u-friend',
  restaurant_id: 'rest1',
  score: 8,
  comment: 'Really great pita.',
  created_at: '2026-01-15T10:00:00Z',
  username: 'alice',
  avatar_url: null,
  restaurant_name: 'Pita Pockets',
  cuisine_type: 'Mediterranean',
  restaurant_image_url: null,
}

function renderItem(entry = mockEntry) {
  return render(
    <MemoryRouter>
      <FeedItem entry={entry} />
    </MemoryRouter>,
  )
}

describe('FeedItem', () => {
  it('renders linked username', () => {
    renderItem()
    const link = screen.getByRole('link', { name: /@alice/i })
    expect(link).toHaveAttribute('href', '/profile/u-friend')
  })

  it('renders restaurant name linked to restaurant detail', () => {
    renderItem()
    const link = screen.getByRole('link', { name: 'Pita Pockets' })
    expect(link).toHaveAttribute('href', '/restaurants/rest1')
  })

  it('renders cuisine type', () => {
    renderItem()
    expect(screen.getByText('Mediterranean')).toBeInTheDocument()
  })

  it('renders score badge', () => {
    renderItem()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('renders comment with line-clamp container', () => {
    renderItem()
    const p = screen.getByText(/really great pita/i)
    expect(p).toHaveClass('line-clamp-2')
  })

  it('shows "No comment" when comment is null', () => {
    renderItem({ ...mockEntry, comment: null })
    expect(screen.getByText(/no comment/i)).toBeInTheDocument()
  })

  it('renders a time element with relative date', () => {
    renderItem()
    const timeEl = screen.getByRole('time')
    expect(timeEl).toHaveAttribute('dateTime', '2026-01-15T10:00:00Z')
    expect(timeEl.textContent).toMatch(/ago/i)
  })

  it('renders avatar initial when no avatar_url', () => {
    renderItem()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders avatar image when avatar_url is set', () => {
    renderItem({ ...mockEntry, avatar_url: 'https://example.com/a.jpg' })
    expect(screen.getByRole('img', { name: 'alice' })).toHaveAttribute('src', 'https://example.com/a.jpg')
  })
})
