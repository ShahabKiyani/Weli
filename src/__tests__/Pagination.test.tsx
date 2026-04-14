import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '@/components/Pagination'

describe('Pagination', () => {
  it('does not render when totalPages is 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders page buttons for small page counts', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument()
  })

  it('disables the Previous button on the first page', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
  })

  it('disables the Next button on the last page', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('calls onPageChange with the correct page when a page button is clicked', async () => {
    const handleChange = vi.fn()
    render(<Pagination page={1} totalPages={5} onPageChange={handleChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(handleChange).toHaveBeenCalledWith(3)
  })

  it('calls onPageChange with page+1 when Next is clicked', async () => {
    const handleChange = vi.fn()
    render(<Pagination page={2} totalPages={5} onPageChange={handleChange} />)
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(handleChange).toHaveBeenCalledWith(3)
  })

  it('calls onPageChange with page-1 when Previous is clicked', async () => {
    const handleChange = vi.fn()
    render(<Pagination page={3} totalPages={5} onPageChange={handleChange} />)
    await userEvent.click(screen.getByRole('button', { name: /previous/i }))
    expect(handleChange).toHaveBeenCalledWith(2)
  })

  it('marks the current page button as aria-current', () => {
    render(<Pagination page={3} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('shows ellipsis for large page counts (> 7)', () => {
    render(<Pagination page={5} totalPages={20} onPageChange={vi.fn()} />)
    const ellipses = screen.getAllByText('…')
    expect(ellipses.length).toBeGreaterThanOrEqual(1)
  })

  it('always shows first and last page for large counts', () => {
    render(<Pagination page={5} totalPages={20} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 20' })).toBeInTheDocument()
  })
})
