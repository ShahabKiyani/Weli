import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useRestaurantReviews } from '@/hooks/useRestaurantReviews'
import { useUserReview } from '@/hooks/useUserReview'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AppLayout } from '@/components/AppLayout'
import { RestaurantHeader } from '@/components/RestaurantHeader'
import { RestaurantLocationMap } from '@/components/RestaurantLocationMap'
import { ActionRow } from '@/components/ActionRow'
import { PublicReviewCard } from '@/components/PublicReviewCard'
import { SkeletonLoader } from '@/components/SkeletonLoader'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [page, setPage] = useState(1)

  const { data: restaurant, isLoading: restaurantLoading, isError } = useRestaurant(id)
  useDocumentTitle(restaurant?.name ?? 'Restaurant')
  const { data: reviewsData, isLoading: reviewsLoading } = useRestaurantReviews(id!, { page })
  const { data: userReview, isLoading: userReviewLoading } = useUserReview(id!, user?.id)

  if (isError) {
    return (
      <AppLayout>
        <div className="py-16 text-center">
          <p className="text-lg font-semibold text-secondary">Restaurant not found</p>
          <p className="text-sm text-text-muted mt-2">
            We couldn&apos;t find the restaurant you&apos;re looking for.
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <RestaurantHeader restaurant={restaurant} loading={restaurantLoading} />

        {!restaurantLoading && restaurant && (
          <>
            <RestaurantLocationMap restaurant={restaurant} />
            <ActionRow
              restaurantId={id!}
              hasReview={!!userReview}
              loading={userReviewLoading}
            />
          </>
        )}

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-3">Community Reviews</h2>

          {reviewsLoading ? (
            <SkeletonLoader variant="list" count={3} />
          ) : reviewsData?.reviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              message="Be the first to share your experience!"
            />
          ) : (
            <>
              <div className="space-y-3">
                {reviewsData?.reviews.map((review) => (
                  <PublicReviewCard key={review.id} review={review} />
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
