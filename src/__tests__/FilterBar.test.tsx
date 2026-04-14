import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBar } from '@/components/FilterBar'
import type { SortOption, ViewMode } from '@/components/FilterBar'

const defaultProps = {
  cuisines: ['Italian', 'Mexican', 'American'],
  activeCuisine: null,
  sort: 'name' as SortOption,
  view: 'list' as ViewMode,
  locationAvailable: true,
  onCuisineChange: vi.fn(),
  onSortChange: vi.fn(),
  onViewChange: vi.fn(),
}

describe('FilterBar', () => {
  it('renders an "All" chip for no cuisine filter', () => {
    render(<FilterBar {...defaultProps} />)
    expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument()
  })

  it('renders a chip for each cuisine', () => {
    render(<FilterBar {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Italian' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mexican' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'American' })).toBeInTheDocument()
  })

  it('marks the active cuisine chip with aria-pressed=true', () => {
    render(<FilterBar {...defaultProps} activeCuisine="Italian" />)
    expect(screen.getByRole('button', { name: 'Italian' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^all$/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onCuisineChange(null) when "All" chip is clicked', async () => {
    const onCuisineChange = vi.fn()
    render(<FilterBar {...defaultProps} onCuisineChange={onCuisineChange} />)
    await userEvent.click(screen.getByRole('button', { name: /^all$/i }))
    expect(onCuisineChange).toHaveBeenCalledWith(null)
  })

  it('calls onCuisineChange with the cuisine name when a cuisine chip is clicked', async () => {
    const onCuisineChange = vi.fn()
    render(<FilterBar {...defaultProps} onCuisineChange={onCuisineChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Mexican' }))
    expect(onCuisineChange).toHaveBeenCalledWith('Mexican')
  })

  it('renders sort buttons: Closest, Top Rated, A-Z', () => {
    render(<FilterBar {...defaultProps} />)
    expect(screen.getByRole('button', { name: /closest/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /top rated/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /a.z/i })).toBeInTheDocument()
  })

  it('calls onSortChange when a sort button is clicked', async () => {
    const onSortChange = vi.fn()
    render(<FilterBar {...defaultProps} onSortChange={onSortChange} />)
    await userEvent.click(screen.getByRole('button', { name: /top rated/i }))
    expect(onSortChange).toHaveBeenCalledWith('rating')
  })

  it('disables the Closest button when locationAvailable is false', () => {
    render(<FilterBar {...defaultProps} locationAvailable={false} />)
    expect(screen.getByRole('button', { name: /closest/i })).toBeDisabled()
  })

  it('renders view toggle buttons for list and map', () => {
    render(<FilterBar {...defaultProps} />)
    expect(screen.getByRole('button', { name: /list view/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /map view/i })).toBeInTheDocument()
  })

  it('calls onViewChange("map") when map view button is clicked', async () => {
    const onViewChange = vi.fn()
    render(<FilterBar {...defaultProps} onViewChange={onViewChange} />)
    await userEvent.click(screen.getByRole('button', { name: /map view/i }))
    expect(onViewChange).toHaveBeenCalledWith('map')
  })
})
