import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FindFriendsModal } from '@/components/FindFriendsModal'
import { useSearchUsers } from '@/hooks/useSearchUsers'
import { useSendFriendRequest } from '@/hooks/useSendFriendRequest'
import { useDebounce } from '@/hooks/useDebounce'

vi.mock('@/hooks/useSearchUsers')
vi.mock('@/hooks/useSendFriendRequest')
vi.mock('@/hooks/useRespondFriendRequest', () => ({
  useRespondFriendRequest: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/useUnfriend', () => ({
  useUnfriend: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/useDebounce')

const mockProfile = {
  id: 'user-a',
  username: 'alice',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  currentUserId: 'user-me',
}

function renderModal(props = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <FindFriendsModal {...defaultProps} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useDebounce).mockImplementation((v) => v)
  vi.mocked(useSearchUsers).mockReturnValue({ data: undefined, isLoading: false } as never)
  vi.mocked(useSendFriendRequest).mockReturnValue({ mutate: vi.fn(), isPending: false } as never)
})

describe('FindFriendsModal', () => {
  it('renders the search input when open is true', () => {
    renderModal()
    expect(screen.getByPlaceholderText(/search by username/i)).toBeInTheDocument()
  })

  it('does not render anything when open is false', () => {
    renderModal({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('has role="dialog" and aria-modal="true"', () => {
    renderModal()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('shows "Type at least 2 characters" hint when query is empty', () => {
    vi.mocked(useDebounce).mockReturnValue('')
    renderModal()
    expect(screen.getByText(/type at least 2/i)).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    const backdrop = screen.getByTestId('modal-backdrop')
    await userEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows a loading skeleton while searching', () => {
    vi.mocked(useDebounce).mockReturnValue('ali')
    vi.mocked(useSearchUsers).mockReturnValue({ data: undefined, isLoading: true } as never)
    renderModal()
    expect(screen.getByRole('status', { name: /searching/i })).toBeInTheDocument()
  })

  it('shows "No users found" when search returns empty array', () => {
    vi.mocked(useDebounce).mockReturnValue('xyz')
    vi.mocked(useSearchUsers).mockReturnValue({ data: [], isLoading: false } as never)
    renderModal()
    expect(screen.getByText(/no users found/i)).toBeInTheDocument()
  })

  it('renders FriendCard for each search result', () => {
    vi.mocked(useDebounce).mockReturnValue('ali')
    vi.mocked(useSearchUsers).mockReturnValue({
      data: [{ profile: mockProfile, friendshipId: null, friendshipStatus: 'none' }],
      isLoading: false,
    } as never)
    renderModal()
    expect(screen.getByText('@alice')).toBeInTheDocument()
  })

  it('calls sendRequest mutation when "Add Friend" is clicked', async () => {
    const mutateFn = vi.fn()
    vi.mocked(useSendFriendRequest).mockReturnValue({ mutate: mutateFn, isPending: false } as never)
    vi.mocked(useDebounce).mockReturnValue('ali')
    vi.mocked(useSearchUsers).mockReturnValue({
      data: [{ profile: mockProfile, friendshipId: null, friendshipStatus: 'none' }],
      isLoading: false,
    } as never)
    renderModal()
    await userEvent.click(screen.getByRole('button', { name: /add friend/i }))
    expect(mutateFn).toHaveBeenCalledWith(expect.objectContaining({
      requesterId: 'user-me',
      addresseeId: 'user-a',
    }))
  })

  it('resets the query when the modal is closed and reopened', async () => {
    const { rerender } = renderModal({ open: true })
    const input = screen.getByPlaceholderText(/search by username/i)
    await userEvent.type(input, 'alice')
    expect(input).toHaveValue('alice')

    // Close then reopen
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <FindFriendsModal {...defaultProps} open={false} />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <FindFriendsModal {...defaultProps} open={true} />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by username/i)).toHaveValue('')
    })
  })
})
