import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from '@/components/EmptyState'

describe('EmptyState', () => {
  it('renders the title and message', () => {
    render(<EmptyState title="No reviews yet" message="Start exploring to add your first review." />)
    expect(screen.getByRole('heading', { name: 'No reviews yet' })).toBeInTheDocument()
    expect(screen.getByText('Start exploring to add your first review.')).toBeInTheDocument()
  })

  it('does not render a CTA button when no action is provided', () => {
    render(<EmptyState title="Empty" message="Nothing here." />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a CTA button when action is provided', () => {
    render(
      <EmptyState
        title="No restaurants"
        message="Add the first one."
        action={{ label: 'Discover restaurants', onClick: vi.fn() }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Discover restaurants' })).toBeInTheDocument()
  })

  it('calls action.onClick when the CTA button is clicked', async () => {
    const handleClick = vi.fn()
    render(
      <EmptyState
        title="Empty"
        message="Nothing here."
        action={{ label: 'Go explore', onClick: handleClick }}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Go explore' }))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
