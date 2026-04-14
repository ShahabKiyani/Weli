import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScoreSelector } from '@/components/ScoreSelector'

describe('ScoreSelector', () => {
  it('renders 10 score buttons', () => {
    render(<ScoreSelector value={null} onChange={vi.fn()} />)
    // each button is role="radio" inside a group
    expect(screen.getAllByRole('radio')).toHaveLength(10)
  })

  it('renders buttons labelled 1 through 10', () => {
    render(<ScoreSelector value={null} onChange={vi.fn()} />)
    for (let i = 1; i <= 10; i++) {
      // use \b (word boundary) to avoid /^1/ matching "10 — Outstanding"
      expect(screen.getByRole('radio', { name: new RegExp(`^${i}\\b`) })).toBeInTheDocument()
    }
  })

  it('shows the label "Awful" near score 1', () => {
    render(<ScoreSelector value={null} onChange={vi.fn()} />)
    expect(screen.getByText(/awful/i)).toBeInTheDocument()
  })

  it('shows the label "Average" near score 5', () => {
    render(<ScoreSelector value={null} onChange={vi.fn()} />)
    expect(screen.getByText(/average/i)).toBeInTheDocument()
  })

  it('shows the label "Outstanding" near score 10', () => {
    render(<ScoreSelector value={null} onChange={vi.fn()} />)
    expect(screen.getByText(/outstanding/i)).toBeInTheDocument()
  })

  it('marks the selected score button as aria-checked=true', () => {
    render(<ScoreSelector value={7} onChange={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /^7\b/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('marks unselected buttons as aria-checked=false', () => {
    render(<ScoreSelector value={7} onChange={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /^1\b/ })).toHaveAttribute('aria-checked', 'false')
  })

  it('no button is aria-checked=true when value is null', () => {
    render(<ScoreSelector value={null} onChange={vi.fn()} />)
    const checked = screen
      .getAllByRole('radio')
      .filter((el) => el.getAttribute('aria-checked') === 'true')
    expect(checked).toHaveLength(0)
  })

  it('calls onChange with the correct score when a button is clicked', async () => {
    const onChange = vi.fn()
    render(<ScoreSelector value={null} onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: /^8\b/ }))
    expect(onChange).toHaveBeenCalledWith(8)
  })

  it('clicking the already-selected button calls onChange again', async () => {
    const onChange = vi.fn()
    render(<ScoreSelector value={5} onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: /^5\b/ }))
    expect(onChange).toHaveBeenCalledWith(5)
  })
})
