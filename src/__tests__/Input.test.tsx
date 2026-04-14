import { describe, it, expect, vi } from 'vitest'
import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/Input'

describe('Input', () => {
  it('renders the label linked to the input', () => {
    render(<Input id="name" label="Full Name" />)
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
  })

  it('shows the error message and sets aria-invalid when error is provided', () => {
    render(<Input id="name" label="Name" error="Name is required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('does not show an error message when no error is provided', () => {
    render(<Input id="name" label="Name" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false')
  })

  it('fires onChange when the user types', async () => {
    const handleChange = vi.fn()
    render(<Input id="name" label="Name" onChange={handleChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'hello')
    expect(handleChange).toHaveBeenCalled()
  })

  it('forwards the ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input id="name" label="Name" ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('passes extra HTML attributes (placeholder, maxLength) through', () => {
    render(<Input id="name" label="Name" placeholder="Enter name" maxLength={50} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder', 'Enter name')
    expect(input).toHaveAttribute('maxLength', '50')
  })
})
