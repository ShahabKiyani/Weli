import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Button } from '@/components/Button'
import { ROUTES } from '@/lib/constants'

/**
 * Dedicated empty state when the friend feed has no reviews to show.
 */
export function FeedEmptyState() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mb-4" aria-hidden="true">
        <Users className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-secondary mb-2">No activity yet</h2>
      <p className="text-sm text-text-muted max-w-sm mb-6">
        Add friends to see their reviews here. When your friends post reviews, they will show up in this feed.
      </p>
      <Button variant="primary" onClick={() => navigate(ROUTES.PROFILE)}>
        Find friends
      </Button>
    </div>
  )
}
