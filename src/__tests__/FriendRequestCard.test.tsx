import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FriendRequestCard } from '@/components/FriendRequestCard'
import type { Friendship, Profile } from '@/types/database.types'

const requesterProfile: Profile = {
  id: 'user-x',
  username: 'xavier',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const mockRequest: Friendship & { requester: Profile } = {
  id: 'f-req-1',
  requester_id: 'user-x',
  addressee_id: 'user-me',
  status: 'pending',
  created_at: '2026-02-15T10:00:00Z',
  updated_at: '2026-02-15T10:00:00Z',
  requester: requesterProfile,
}

const defaultProps = {
  request: mockRequest,
  onAccept: vi.fn(),
  onDecline: vi.fn(),
  isAccepting: false,
  isDeclining: false,
}

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <FriendRequestCard {...defaultProps} {...props} />
    </MemoryRouter>,
  )
}

beforeEach(() => vi.resetAllMocks())

describe('FriendRequestCard', () => {
  it('renders the requester username', () => {
    renderCard()
    expect(screen.getByText('@xavier')).toBeInTheDocument()
  })

  it('renders "sent you a friend request" text', () => {
    renderCard()
    expect(screen.getByText(/sent you a friend request/i)).toBeInTheDocument()
  })

  it('renders an Avatar initial placeholder when no avatar_url', () => {
    renderCard()
    expect(screen.getByText('X')).toBeInTheDocument()
  })

  it('renders an avatar image when avatar_url is provided', () => {
    const reqWithAvatar = {
      ...mockRequest,
      requester: { ...requesterProfile, avatar_url: 'https://example.com/x.jpg' },
    }
    renderCard({ request: reqWithAvatar })
    expect(screen.getByRole('img', { name: 'xavier' })).toBeInTheDocument()
  })

  it('renders Accept and Decline buttons', () => {
    renderCard()
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
  })

  it('calls onAccept with the friendshipId when Accept is clicked', async () => {
    const onAccept = vi.fn()
    renderCard({ onAccept })
    await userEvent.click(screen.getByRole('button', { name: /accept/i }))
    expect(onAccept).toHaveBeenCalledWith('f-req-1')
  })

  it('calls onDecline with the friendshipId when Decline is clicked', async () => {
    const onDecline = vi.fn()
    renderCard({ onDecline })
    await userEvent.click(screen.getByRole('button', { name: /decline/i }))
    expect(onDecline).toHaveBeenCalledWith('f-req-1')
  })

  it('disables the Accept button and shows loading when isAccepting is true', () => {
    renderCard({ isAccepting: true })
    expect(screen.getByRole('button', { name: /accept/i })).toBeDisabled()
  })

  it('disables the Decline button and shows loading when isDeclining is true', () => {
    renderCard({ isDeclining: true })
    expect(screen.getByRole('button', { name: /decline/i })).toBeDisabled()
  })

  it('links the username to the requester profile page', () => {
    renderCard()
    const link = screen.getByRole('link', { name: /@xavier/i })
    expect(link).toHaveAttribute('href', `/profile/${requesterProfile.id}`)
  })
})
