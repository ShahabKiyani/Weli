import type { RestaurantStats } from '@/types/database.types'

interface RestaurantHeaderProps {
  restaurant: RestaurantStats | undefined
  loading: boolean
}

export function RestaurantHeader({ restaurant, loading }: RestaurantHeaderProps) {
  if (loading || !restaurant) {
    return (
      <div role="status" aria-label="Loading restaurant" className="animate-pulse space-y-3">
        <div className="h-8 bg-surface rounded w-2/3" />
        <div className="h-4 bg-surface rounded w-1/2" />
        <div className="flex items-center gap-4 mt-4">
          <div className="h-16 w-16 bg-surface rounded-full" />
          <div className="space-y-2">
            <div className="h-5 bg-surface rounded w-24" />
            <div className="h-4 bg-surface rounded w-16" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-secondary">{restaurant.name}</h1>
          <p className="text-sm text-text-muted mt-0.5">{restaurant.address}</p>
          <span className="inline-block mt-2 rounded-full bg-surface border border-border px-3 py-1 text-xs font-medium text-text-muted">
            {restaurant.cuisine_type}
          </span>
        </div>

        <div className="shrink-0 text-center">
          <div className="text-4xl font-bold text-primary leading-none">
            {restaurant.avg_score.toFixed(1)}
          </div>
          <div className="text-xs text-text-muted mt-0.5">/ 10</div>
          <div className="text-xs text-text-muted mt-1">
            {restaurant.review_count} {restaurant.review_count === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </div>
    </div>
  )
}
