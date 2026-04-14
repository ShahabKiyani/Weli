import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Button } from '@/components/Button'
import { ROUTES } from '@/lib/constants'
import type { FriendshipStatus, Profile } from '@/types/database.types'

export type FriendCardVariant = 'compact' | 'full'

export interface FriendCardProps {
  profile: Profile
  friendshipId: string | null
  status: FriendshipStatus
  variant?: FriendCardVariant
  mutualCount?: number
  onSendRequest: (profile: Profile) => void
  onAccept: (friendshipId: string) => void
  onUnfriend: (friendshipId: string) => void
  isLoading?: boolean
}

function Avatar({ profile }: { profile: Profile }) {
  const initial = (profile.username ?? '?')[0].toUpperCase()

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.username ?? 'User'}
        className="w-10 h-10 rounded-full object-cover shrink-0"
      />
    )
  }

  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold text-sm">
      {initial}
    </div>
  )
}

function ActionButton({
  status, friendshipId, onSendRequest, onAccept, onUnfriend, profile, isLoading,
}: Pick<FriendCardProps, 'status' | 'friendshipId' | 'onSendRequest' | 'onAccept' | 'onUnfriend' | 'profile' | 'isLoading'>) {
  if (status === 'none') {
    return (
      <Button variant="primary" className="text-xs px-3 py-1.5 h-auto" onClick={() => onSendRequest(profile)} loading={isLoading}>
        Add Friend
      </Button>
    )
  }

  if (status === 'pending_sent') {
    return (
      <Button variant="ghost" className="text-xs px-3 py-1.5 h-auto" disabled>
        Request Sent
      </Button>
    )
  }

  if (status === 'pending_received') {
    return (
      <Button
        variant="primary"
        className="text-xs px-3 py-1.5 h-auto"
        onClick={() => friendshipId && onAccept(friendshipId)}
        loading={isLoading}
      >
        Accept
      </Button>
    )
  }

  // accepted
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        Friends
      </span>
      <Button
        variant="ghost"
        className="text-xs px-2 py-1 h-auto text-error border-error/30 hover:bg-error/10"
        onClick={() => friendshipId && onUnfriend(friendshipId)}
        loading={isLoading}
      >
        Unfriend
      </Button>
    </div>
  )
}

/**
 * Displays a user profile with a context-sensitive friendship action button.
 * Use `variant="full"` on suggestion cards to show the mutual friend count.
 */
export function FriendCard({
  profile,
  friendshipId,
  status,
  variant = 'compact',
  mutualCount = 0,
  onSendRequest,
  onAccept,
  onUnfriend,
  isLoading,
}: FriendCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
      <Link to={ROUTES.PUBLIC_PROFILE(profile.id)} className="shrink-0">
        <Avatar profile={profile} />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={ROUTES.PUBLIC_PROFILE(profile.id)}
          className="text-sm font-semibold text-secondary hover:text-primary transition-colors truncate block"
        >
          @{profile.username ?? profile.id}
        </Link>
        {variant === 'full' && mutualCount > 0 && (
          <p className="text-xs text-text-muted mt-0.5">
            {mutualCount} mutual {mutualCount === 1 ? 'friend' : 'friends'}
          </p>
        )}
      </div>

      <ActionButton
        status={status}
        friendshipId={friendshipId}
        onSendRequest={onSendRequest}
        onAccept={onAccept}
        onUnfriend={onUnfriend}
        profile={profile}
        isLoading={isLoading}
      />
    </div>
  )
}
