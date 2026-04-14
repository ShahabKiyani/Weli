import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreBadge } from '@/components/ScoreBadge'

describe('ScoreBadge', () => {
  it('displays the score value', () => {
    render(<ScoreBadge score={8} />)
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('circle variant renders at 48x48 size', () => {
    render(<ScoreBadge score={7} variant="circle" />)
    const badge = screen.getByText('7').closest('[data-variant="circle"]')
    expect(badge).toBeInTheDocument()
  })

  it('pill variant renders as pill', () => {
    render(<ScoreBadge score={7} variant="pill" />)
    const badge = screen.getByText('7').closest('[data-variant="pill"]')
    expect(badge).toBeInTheDocument()
  })

  it('defaults to circle variant', () => {
    render(<ScoreBadge score={5} />)
    expect(screen.getByText('5').closest('[data-variant="circle"]')).toBeInTheDocument()
  })

  it('scores 1–3 use error (red) color', () => {
    render(<ScoreBadge score={2} />)
    expect(screen.getByText('2').closest('[data-score-tier]')).toHaveAttribute(
      'data-score-tier',
      'low',
    )
  })

  it('scores 4–6 use warning (amber) color', () => {
    render(<ScoreBadge score={5} />)
    expect(screen.getByText('5').closest('[data-score-tier]')).toHaveAttribute(
      'data-score-tier',
      'mid',
    )
  })

  it('scores 7–10 use primary color', () => {
    render(<ScoreBadge score={9} />)
    expect(screen.getByText('9').closest('[data-score-tier]')).toHaveAttribute(
      'data-score-tier',
      'high',
    )
  })

  it('boundary: score 3 is low, score 4 is mid, score 6 is mid, score 7 is high', () => {
    const { rerender } = render(<ScoreBadge score={3} />)
    expect(screen.getByText('3').closest('[data-score-tier]')).toHaveAttribute(
      'data-score-tier',
      'low',
    )

    rerender(<ScoreBadge score={4} />)
    expect(screen.getByText('4').closest('[data-score-tier]')).toHaveAttribute(
      'data-score-tier',
      'mid',
    )

    rerender(<ScoreBadge score={6} />)
    expect(screen.getByText('6').closest('[data-score-tier]')).toHaveAttribute(
      'data-score-tier',
      'mid',
    )

    rerender(<ScoreBadge score={7} />)
    expect(screen.getByText('7').closest('[data-score-tier]')).toHaveAttribute(
      'data-score-tier',
      'high',
    )
  })
})
