import { Link } from 'react-router-dom'
import type { RestaurantWithDistance } from '@/types/database.types'
import { ScoreBadge } from '@/components/ScoreBadge'
import { formatDistance } from '@/lib/geo'
import { ROUTES } from '@/lib/constants'

interface RestaurantCardProps {
  restaurant: RestaurantWithDistance
  highlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function RestaurantCard({
  restaurant,
  highlighted = false,
  onMouseEnter,
  onMouseLeave,
}: RestaurantCardProps) {
  return (
    <article
      data-highlighted={String(highlighted)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={[
        'flex gap-4 rounded-xl border bg-card p-4 transition-all',
        highlighted ? 'border-primary shadow-md' : 'border-border hover:shadow-sm',
      ].join(' ')}
    >
      {/* Image placeholder */}
      <div className="w-20 h-20 rounded-lg bg-surface shrink-0 overflow-hidden">
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-2xl">
            🍽️
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          to={ROUTES.RESTAURANT_DETAIL(restaurant.id)}
          className="block font-semibold text-secondary hover:text-primary transition-colors truncate"
        >
          {restaurant.name}
        </Link>
        <span className="inline-block mt-1 rounded-full bg-surface border border-border px-2 py-0.5 text-xs text-text-muted">
          {restaurant.cuisine_type}
        </span>
        <p className="mt-1 text-xs text-text-muted">{formatDistance(restaurant.distanceKm)}</p>
      </div>

      <ScoreBadge score={Math.round(restaurant.avg_score)} variant="circle" className="shrink-0" />
    </article>
  )
}
