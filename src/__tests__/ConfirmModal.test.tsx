import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmModal } from '@/components/ConfirmModal'

const defaultProps = {
  isOpen: true,
  title: 'Delete review',
  message: 'This action cannot be undone.',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('ConfirmModal', () => {
  it('does not render when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('displays the title and message', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Delete review')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('calls onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when the cancel button is clicked', async () => {
    const onCancel = vi.fn()
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when the backdrop is clicked', async () => {
    const onCancel = vi.fn()
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />)
    await userEvent.click(screen.getByTestId('modal-backdrop'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Escape key is pressed', async () => {
    const onCancel = vi.fn()
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />)
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('supports custom confirm and cancel label text', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmLabel="Yes, delete"
        cancelLabel="No, keep it"
      />,
    )
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No, keep it' })).toBeInTheDocument()
  })

  it('has aria-modal and aria-labelledby for accessibility', () => {
    render(<ConfirmModal {...defaultProps} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })
})
