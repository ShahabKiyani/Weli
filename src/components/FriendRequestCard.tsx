import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { ROUTES } from '@/lib/constants'
import type { Profile } from '@/types/database.types'
import type { FriendshipWithRequester } from '@/hooks/useFriendRequests'

export type { FriendshipWithRequester }

export interface FriendRequestCardProps {
  request: FriendshipWithRequester
  onAccept: (friendshipId: string) => void
  onDecline: (friendshipId: string) => void
  isAccepting?: boolean
  isDeclining?: boolean
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

/**
 * Displays a single incoming friend request with Accept and Decline actions.
 * Both buttons support individual loading states so they can be disabled
 * independently while a mutation is in-flight.
 */
export function FriendRequestCard({
  request,
  onAccept,
  onDecline,
  isAccepting = false,
  isDeclining = false,
}: FriendRequestCardProps) {
  const { requester } = request

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
      <Link to={ROUTES.PUBLIC_PROFILE(requester.id)} className="shrink-0">
        <Avatar profile={requester} />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={ROUTES.PUBLIC_PROFILE(requester.id)}
          className="text-sm font-semibold text-secondary hover:text-primary transition-colors truncate block"
        >
          @{requester.username ?? requester.id}
        </Link>
        <p className="text-xs text-text-muted mt-0.5">sent you a friend request</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="primary"
          className="text-xs px-3 py-1.5 h-auto"
          onClick={() => onAccept(request.id)}
          loading={isAccepting}
          disabled={isAccepting || isDeclining}
        >
          Accept
        </Button>
        <Button
          variant="ghost"
          className="text-xs px-3 py-1.5 h-auto"
          onClick={() => onDecline(request.id)}
          loading={isDeclining}
          disabled={isAccepting || isDeclining}
        >
          Decline
        </Button>
      </div>
    </div>
  )
}
