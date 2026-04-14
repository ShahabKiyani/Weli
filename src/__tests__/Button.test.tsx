import { describe, it, expect, vi } from 'vitest'
import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/Button'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('is disabled and shows a spinner when loading', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does not fire onClick when loading', async () => {
    const handleClick = vi.fn()
    render(<Button loading onClick={handleClick}>Save</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('is disabled and does not fire onClick when disabled prop is set', async () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Save</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders primary variant by default', () => {
    render(<Button>Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')
  })

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-secondary')
  })

  it('renders ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-transparent')
  })

  it('renders google variant', () => {
    render(<Button variant="google">Sign in with Google</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-white')
  })

  it('passes extra HTML attributes through to the button', () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>)
    const btn = screen.getByTestId('submit-btn')
    expect(btn).toHaveAttribute('type', 'submit')
  })

  it('forwards ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref button</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('merges extra className with base styles', () => {
    render(<Button className="custom-class">Styled</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('loading spinner has an accessible label', () => {
    render(<Button loading>Saving</Button>)
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })
})
