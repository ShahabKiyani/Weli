import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'

interface ActionRowProps {
  restaurantId: string
  hasReview: boolean
  loading: boolean
  className?: string
}

export function ActionRow({ restaurantId, hasReview, loading, className = '' }: ActionRowProps) {
  if (loading) {
    return (
      <div role="status" aria-label="Loading action" className={`animate-pulse ${className}`}>
        <div className="h-12 bg-surface rounded-xl w-full" />
      </div>
    )
  }

  return (
    <div className={className}>
      <Link
        to={ROUTES.REVIEW_FORM(restaurantId)}
        className="flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors w-full"
      >
        {hasReview ? 'Edit Your Review' : 'Leave a Review'}
      </Link>
    </div>
  )
}
