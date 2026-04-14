import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from '@/components/Toast'

function TestConsumer({ label, type }: { label: string; type?: 'success' | 'error' }) {
  const { showToast, dismissToast, toasts } = useToast()
  return (
    <div>
      <button onClick={() => showToast(label, type ?? 'success')}>Show</button>
      <button onClick={() => toasts[0] && dismissToast(toasts[0].id)}>Dismiss</button>
    </div>
  )
}

function renderWithToast(consumer = <TestConsumer label="Hello!" />) {
  return render(<ToastProvider>{consumer}</ToastProvider>)
}

describe('useToast outside ToastProvider', () => {
  it('throws with a descriptive message', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer label="x" />)).toThrow(
      'useToast must be used within a ToastProvider',
    )
    consoleError.mockRestore()
  })
})

// Tests that use real timers (no auto-dismiss interaction)
describe('Toast system — rendering', () => {
  it('shows a success toast when showToast is called', async () => {
    renderWithToast()
    await userEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByText('Hello!')).toBeInTheDocument()
  })

  it('renders a success toast with a success data-type attribute', async () => {
    renderWithToast(<TestConsumer label="Saved!" type="success" />)
    await userEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByRole('status')).toHaveAttribute('data-type', 'success')
  })

  it('renders an error toast with an error data-type attribute', async () => {
    renderWithToast(<TestConsumer label="Failed!" type="error" />)
    await userEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByRole('status')).toHaveAttribute('data-type', 'error')
  })

  it('dismisses a toast manually via the dismiss button', async () => {
    renderWithToast()
    await userEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByText('Hello!')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    await waitFor(() => expect(screen.queryByText('Hello!')).not.toBeInTheDocument())
  })

  it('can stack multiple toasts', async () => {
    render(
      <ToastProvider>
        <TestConsumer label="First" />
        <TestConsumer label="Second" />
      </ToastProvider>,
    )
    const showBtns = screen.getAllByRole('button', { name: 'Show' })
    await userEvent.click(showBtns[0])
    await userEvent.click(showBtns[1])
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })
})

// Tests that rely on fake timers for auto-dismiss
describe('Toast system — auto-dismiss', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('auto-dismisses after 4 seconds', async () => {
    renderWithToast()
    // fireEvent is synchronous — safe to use under fake timers
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Show' })))
    expect(screen.getByText('Hello!')).toBeInTheDocument()

    // await act flushes all React state updates triggered by the timer
    await act(async () => vi.advanceTimersByTime(4000))
    expect(screen.queryByText('Hello!')).not.toBeInTheDocument()
  })

  it('does not dismiss before 4 seconds have elapsed', () => {
    renderWithToast()
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Show' })))

    act(() => vi.advanceTimersByTime(3999))
    expect(screen.getByText('Hello!')).toBeInTheDocument()
  })
})
