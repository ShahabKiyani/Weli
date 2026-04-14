import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocationPrompt } from '@/components/LocationPrompt'

describe('LocationPrompt', () => {
  it('renders the enable-location message', () => {
    render(<LocationPrompt onAllow={vi.fn()} onDismiss={vi.fn()} />)
    expect(screen.getByText(/enable location/i)).toBeInTheDocument()
  })

  it('has an "Allow" button', () => {
    render(<LocationPrompt onAllow={vi.fn()} onDismiss={vi.fn()} />)
    expect(screen.getByRole('button', { name: /allow/i })).toBeInTheDocument()
  })

  it('has a dismiss button', () => {
    render(<LocationPrompt onAllow={vi.fn()} onDismiss={vi.fn()} />)
    expect(screen.getByRole('button', { name: /dismiss location prompt/i })).toBeInTheDocument()
  })

  it('calls onAllow when the Allow button is clicked', async () => {
    const onAllow = vi.fn()
    render(<LocationPrompt onAllow={onAllow} onDismiss={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /allow/i }))
    expect(onAllow).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const onDismiss = vi.fn()
    render(<LocationPrompt onAllow={vi.fn()} onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: /dismiss location prompt/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
