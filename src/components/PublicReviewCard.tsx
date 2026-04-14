import { formatDistanceToNow } from 'date-fns'
import { ScoreBadge } from '@/components/ScoreBadge'
import type { ReviewWithProfile } from '@/types/database.types'

interface PublicReviewCardProps {
  review: ReviewWithProfile
}

export function PublicReviewCard({ review }: PublicReviewCardProps) {
  const profile = review.profiles
  const username = profile?.username ?? 'Unknown'
  const avatarUrl = profile?.avatar_url
  const initial = username.charAt(0).toUpperCase()
  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true })

  return (
    <div className="flex gap-3 bg-card border border-border rounded-xl p-4">
      {/* Avatar */}
      <div className="shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{initial}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-secondary">@{username}</span>
          <div className="flex items-center gap-2 shrink-0">
            <ScoreBadge score={review.score} variant="pill" />
            <time
              dateTime={review.created_at}
              className="text-xs text-text-muted whitespace-nowrap"
            >
              {timeAgo}
            </time>
          </div>
        </div>

        <p className="mt-1 text-sm text-text-muted">
          {review.comment ?? <span className="italic">No comment</span>}
        </p>
      </div>
    </div>
  )
}
