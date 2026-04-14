import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import type { FriendFeedEntry } from '@/types/database.types'
import { ScoreBadge } from '@/components/ScoreBadge'
import { ROUTES } from '@/lib/constants'

export interface FeedItemProps {
  entry: FriendFeedEntry
}

function Avatar({ entry }: { entry: FriendFeedEntry }) {
  const name = entry.username ?? 'User'
  const initial = (entry.username ?? '?')[0].toUpperCase()

  if (entry.avatar_url) {
    return (
      <img
        src={entry.avatar_url}
        alt={name}
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
 * Single feed row: friend identity, restaurant link, score, comment preview,
 * and relative time — visually aligned with `ReviewItem` but includes avatar + username.
 */
export function FeedItem({ entry }: FeedItemProps) {
  const timeAgo = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })
  const displayName = entry.username ?? entry.user_id

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex gap-4">
      <Link to={ROUTES.PUBLIC_PROFILE(entry.user_id)} className="shrink-0 self-start">
        <Avatar entry={entry} />
      </Link>

      <ScoreBadge score={entry.score} variant="circle" className="shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={ROUTES.PUBLIC_PROFILE(entry.user_id)}
            className="text-sm font-semibold text-secondary hover:text-primary transition-colors truncate"
          >
            @{displayName}
          </Link>
          <time
            dateTime={entry.created_at}
            className="text-xs text-text-muted whitespace-nowrap shrink-0"
          >
            {timeAgo}
          </time>
        </div>

        <div className="mt-1 min-w-0">
          <Link
            to={ROUTES.RESTAURANT_DETAIL(entry.restaurant_id)}
            className="font-semibold text-secondary hover:text-primary transition-colors truncate block"
          >
            {entry.restaurant_name}
          </Link>
          <span className="text-xs text-text-muted">{entry.cuisine_type}</span>
        </div>

        <p className="mt-2 text-sm text-text-muted line-clamp-2">
          {entry.comment ?? <span className="italic">No comment</span>}
        </p>
      </div>
    </div>
  )
}
