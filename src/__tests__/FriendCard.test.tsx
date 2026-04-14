import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FriendCard } from '@/components/FriendCard'
import type { Profile } from '@/types/database.types'

const profile: Profile = {
  id: 'user-a',
  username: 'alice',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const profileWithAvatar: Profile = { ...profile, avatar_url: 'https://example.com/avatar.jpg' }

const defaultProps = {
  profile,
  friendshipId: null as string | null,
  status: 'none' as const,
  onSendRequest: vi.fn(),
  onAccept: vi.fn(),
  onUnfriend: vi.fn(),
}

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <FriendCard {...defaultProps} {...props} />
    </MemoryRouter>,
  )
}

beforeEach(() => vi.resetAllMocks())

describe('FriendCard', () => {
  it('renders the username', () => {
    renderCard()
    expect(screen.getByText('@alice')).toBeInTheDocument()
  })

  it('renders an avatar image when avatar_url is provided', () => {
    renderCard({ profile: profileWithAvatar })
    expect(screen.getByRole('img', { name: 'alice' })).toBeInTheDocument()
  })

  it('renders an initial placeholder when no avatar_url', () => {
    renderCard()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('shows "Add Friend" button when status is "none"', () => {
    renderCard({ status: 'none' })
    expect(screen.getByRole('button', { name: /add friend/i })).toBeInTheDocument()
  })

  it('calls onSendRequest with the profile when "Add Friend" is clicked', async () => {
    const onSendRequest = vi.fn()
    renderCard({ status: 'none', onSendRequest })
    await userEvent.click(screen.getByRole('button', { name: /add friend/i }))
    expect(onSendRequest).toHaveBeenCalledWith(profile)
  })

  it('shows a disabled "Request Sent" button when status is "pending_sent"', () => {
    renderCard({ status: 'pending_sent', friendshipId: 'f1' })
    const btn = screen.getByRole('button', { name: /request sent/i })
    expect(btn).toBeDisabled()
  })

  it('shows "Accept" button when status is "pending_received"', () => {
    renderCard({ status: 'pending_received', friendshipId: 'f1' })
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
  })

  it('calls onAccept with the friendshipId when "Accept" is clicked', async () => {
    const onAccept = vi.fn()
    renderCard({ status: 'pending_received', friendshipId: 'f1', onAccept })
    await userEvent.click(screen.getByRole('button', { name: /accept/i }))
    expect(onAccept).toHaveBeenCalledWith('f1')
  })

  it('shows "Friends" indicator when status is "accepted"', () => {
    renderCard({ status: 'accepted', friendshipId: 'f1' })
    expect(screen.getByText(/friends/i)).toBeInTheDocument()
  })

  it('shows "Unfriend" option when status is "accepted"', async () => {
    renderCard({ status: 'accepted', friendshipId: 'f1' })
    expect(screen.getByRole('button', { name: /unfriend/i })).toBeInTheDocument()
  })

  it('calls onUnfriend with the friendshipId when "Unfriend" is clicked', async () => {
    const onUnfriend = vi.fn()
    renderCard({ status: 'accepted', friendshipId: 'f1', onUnfriend })
    await userEvent.click(screen.getByRole('button', { name: /unfriend/i }))
    expect(onUnfriend).toHaveBeenCalledWith('f1')
  })

  it('shows mutual count in full variant when mutualCount > 0', () => {
    renderCard({ variant: 'full', mutualCount: 3 })
    expect(screen.getByText(/3.*mutual/i)).toBeInTheDocument()
  })

  it('does not show mutual count in compact variant', () => {
    renderCard({ variant: 'compact', mutualCount: 3 })
    expect(screen.queryByText(/mutual/i)).not.toBeInTheDocument()
  })

  it('links the username to the user profile page', () => {
    renderCard()
    const link = screen.getByRole('link', { name: /alice/i })
    expect(link).toHaveAttribute('href', `/profile/${profile.id}`)
  })
})
