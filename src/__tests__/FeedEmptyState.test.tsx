import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FeedEmptyState } from '@/components/FeedEmptyState'

function renderEmpty() {
  return render(
    <MemoryRouter initialEntries={['/feed']}>
      <Routes>
        <Route path="/feed" element={<FeedEmptyState />} />
        <Route path="/profile" element={<div>Profile Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FeedEmptyState', () => {
  it('renders a heading about adding friends', () => {
    renderEmpty()
    expect(screen.getByRole('heading', { name: /no activity yet/i })).toBeInTheDocument()
  })

  it('renders explanatory message', () => {
    renderEmpty()
    expect(screen.getByText(/add friends to see their reviews/i)).toBeInTheDocument()
  })

  it('renders a CTA button linking to profile', async () => {
    renderEmpty()
    const btn = screen.getByRole('button', { name: /find friends/i })
    await userEvent.click(btn)
    expect(screen.getByText('Profile Page')).toBeInTheDocument()
  })
})
