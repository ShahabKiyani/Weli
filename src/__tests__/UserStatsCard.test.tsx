import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database.types'
import { UserStatsCard } from '@/components/UserStatsCard'

const mockUser = {
  id: 'u1',
  email: 'test@example.com',
  user_metadata: { avatar_url: 'https://example.com/avatar.jpg' },
} as unknown as User

const mockProfile = {
  id: 'u1',
  username: 'amherst_foodie',
  avatar_url: null,
  created_at: '2026-01-15T12:00:00Z',
  updated_at: '2026-01-15T12:00:00Z',
} as unknown as Profile

const mockStats = { reviewCount: 12, avgScore: 7.4 }

describe('UserStatsCard', () => {
  it('shows a loading skeleton when loading prop is true', () => {
    render(
      <UserStatsCard user={mockUser} profile={mockProfile} stats={undefined} loading={true} />,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('12')).not.toBeInTheDocument()
  })

  it('displays the review count', () => {
    render(
      <UserStatsCard user={mockUser} profile={mockProfile} stats={mockStats} loading={false} />,
    )
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('displays the average score formatted to 1 decimal', () => {
    render(
      <UserStatsCard user={mockUser} profile={mockProfile} stats={mockStats} loading={false} />,
    )
    expect(screen.getByText('7.4')).toBeInTheDocument()
  })

  it('displays "—" for avg score when no reviews', () => {
    render(
      <UserStatsCard
        user={mockUser}
        profile={mockProfile}
        stats={{ reviewCount: 0, avgScore: null }}
        loading={false}
      />,
    )
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('shows member since only in the header subtitle, not as a third stat label', () => {
    render(
      <UserStatsCard
        user={mockUser}
        profile={mockProfile}
        stats={mockStats}
        friendsCount={5}
        loading={false}
      />,
    )
    expect(screen.getByText(/member since january 2026/i)).toBeInTheDocument()
    expect(screen.queryByText('Member Since')).not.toBeInTheDocument()
    expect(screen.getByText('Friends')).toBeInTheDocument()
  })

  it('displays friends count in the third stat column when friendsCount is provided', () => {
    render(
      <UserStatsCard
        user={mockUser}
        profile={mockProfile}
        stats={mockStats}
        friendsCount={5}
        loading={false}
      />,
    )
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Friends')).toBeInTheDocument()
  })

  it('shows "—" for friends when friendsCount is undefined', () => {
    render(
      <UserStatsCard user={mockUser} profile={mockProfile} stats={mockStats} loading={false} />,
    )
    const friendsLabel = screen.getByText('Friends')
    expect(friendsLabel).toBeInTheDocument()
    const statCells = screen.getAllByText('—')
    expect(statCells.length).toBeGreaterThanOrEqual(1)
  })

  it('renders an avatar image when user has avatar_url in user_metadata', () => {
    render(
      <UserStatsCard user={mockUser} profile={mockProfile} stats={mockStats} loading={false} />,
    )
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('renders a profile avatar image when profile has avatar_url', () => {
    const profileWithAvatar = { ...mockProfile, avatar_url: 'https://example.com/profile.jpg' } as unknown as Profile
    const userNoAvatar = { ...mockUser, user_metadata: {} } as unknown as User
    render(
      <UserStatsCard
        user={userNoAvatar}
        profile={profileWithAvatar}
        stats={mockStats}
        loading={false}
      />,
    )
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/profile.jpg')
  })

  it('renders gracefully when stats is undefined (still loading)', () => {
    render(
      <UserStatsCard user={mockUser} profile={mockProfile} stats={undefined} loading={false} />,
    )
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('renders username initial when no avatar is available', () => {
    const userNoAvatar = { ...mockUser, user_metadata: {} } as unknown as User
    const profileNoAvatar = { ...mockProfile, avatar_url: null } as unknown as Profile
    render(
      <UserStatsCard
        user={userNoAvatar}
        profile={profileNoAvatar}
        stats={mockStats}
        loading={false}
      />,
    )
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders optional avatarAction next to avatar', () => {
    render(
      <UserStatsCard
        user={mockUser}
        profile={mockProfile}
        stats={mockStats}
        friendsCount={0}
        loading={false}
        avatarAction={<button type="button">Change photo</button>}
      />,
    )
    expect(screen.getByRole('button', { name: /change photo/i })).toBeInTheDocument()
  })
})
