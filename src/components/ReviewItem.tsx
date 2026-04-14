import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import type { ReviewWithRestaurant } from '@/types/database.types'
import { ScoreBadge } from '@/components/ScoreBadge'

interface ReviewItemProps {
  review: ReviewWithRestaurant
}

export function ReviewItem({ review }: ReviewItemProps) {
  const restaurant = review.restaurants
  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true })

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex gap-4">
      <ScoreBadge score={review.score} variant="circle" className="shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {restaurant ? (
              <Link
                to={`/restaurants/${restaurant.id}`}
                className="font-semibold text-secondary hover:text-primary transition-colors truncate block"
              >
                {restaurant.name}
              </Link>
            ) : (
              <span className="font-semibold text-secondary">Unknown restaurant</span>
            )}
            {restaurant && (
              <span className="text-xs text-text-muted">{restaurant.cuisine_type}</span>
            )}
          </div>
          <time
            dateTime={review.created_at}
            className="text-xs text-text-muted whitespace-nowrap shrink-0"
          >
            {timeAgo}
          </time>
        </div>

        <p className="mt-2 text-sm text-text-muted line-clamp-2">
          {review.comment ?? <span className="italic">No comment</span>}
        </p>
      </div>
    </div>
  )
}
