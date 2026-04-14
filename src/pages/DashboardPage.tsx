import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useMyReviews } from '@/hooks/useMyReviews'
import { useMyStats } from '@/hooks/useMyStats'
import { useFriends } from '@/hooks/useFriends'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AppLayout } from '@/components/AppLayout'
import { UserStatsCard } from '@/components/UserStatsCard'
import { ReviewItem } from '@/components/ReviewItem'
import { SkeletonLoader } from '@/components/SkeletonLoader'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { ROUTES } from '@/lib/constants'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [page, setPage] = useState(1)

  const { data: reviewsData, isLoading: reviewsLoading } = useMyReviews(user?.id, { page })
  const { data: stats, isLoading: statsLoading } = useMyStats(user?.id)
  const { data: friends, isLoading: friendsLoading } = useFriends(user?.id)

  const displayName = profile?.username ?? user?.email?.split('@')[0] ?? 'there'
  const greeting = `${getGreeting()}, @${displayName}`

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-secondary">{greeting}</h1>

        <UserStatsCard
          user={user}
          profile={profile}
          stats={stats}
          loading={statsLoading}
          friendsCount={friendsLoading ? undefined : (friends?.length ?? 0)}
        />

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-3">Your Reviews</h2>

          {reviewsLoading ? (
            <SkeletonLoader variant="list" count={3} />
          ) : reviewsData?.reviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              message="Explore Amherst restaurants and leave your first review!"
              action={{
                label: 'Discover restaurants',
                onClick: () => navigate(ROUTES.DISCOVER),
              }}
            />
          ) : (
            <>
              <div className="space-y-3">
                {reviewsData?.reviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </div>

              {reviewsData && reviewsData.totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={reviewsData.totalPages}
                  onPageChange={setPage}
                  className="mt-6"
                />
              )}
            </>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
