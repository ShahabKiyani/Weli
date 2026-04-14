import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Users, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePublicProfile } from '@/hooks/usePublicProfile'
import { useMyReviews } from '@/hooks/useMyReviews'
import { useSendFriendRequest } from '@/hooks/useSendFriendRequest'
import { useRespondFriendRequest } from '@/hooks/useRespondFriendRequest'
import { useUnfriend } from '@/hooks/useUnfriend'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AppLayout } from '@/components/AppLayout'
import { Button } from '@/components/Button'
import { ReviewItem } from '@/components/ReviewItem'
import { SkeletonLoader } from '@/components/SkeletonLoader'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { ROUTES } from '@/lib/constants'
import type { FriendshipStatus } from '@/types/database.types'

interface FriendshipActionProps {
  status: FriendshipStatus
  friendshipId: string | null
  isLoading: boolean
  onSendRequest: () => void
  onAccept: (id: string) => void
  onUnfriend: (id: string) => void
}

function FriendshipAction({
  status, friendshipId, isLoading, onSendRequest, onAccept, onUnfriend,
}: FriendshipActionProps) {
  if (status === 'none') {
    return (
      <Button variant="primary" onClick={onSendRequest} loading={isLoading} className="gap-1.5">
        <UserPlus className="w-4 h-4" aria-hidden="true" />
        Add Friend
      </Button>
    )
  }
  if (status === 'pending_sent') {
    return <Button variant="ghost" disabled>Request Sent</Button>
  }
  if (status === 'pending_received') {
    return (
      <Button variant="primary" onClick={() => onAccept(friendshipId!)} loading={isLoading}>
        Accept
      </Button>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-muted flex items-center gap-1">
        <Users className="w-4 h-4" aria-hidden="true" />
        Friends
      </span>
      <Button
        variant="ghost"
        className="text-sm text-error border-error/30 hover:bg-error/10"
        onClick={() => onUnfriend(friendshipId!)}
        loading={isLoading}
      >
        Unfriend
      </Button>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile" className="animate-pulse space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-surface shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-surface rounded w-32" />
            <div className="h-3 bg-surface rounded w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-surface rounded" />
          <div className="h-10 bg-surface rounded" />
        </div>
      </div>
    </div>
  )
}

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  useDocumentTitle('Profile')

  // If viewing own profile redirect to /profile
  useEffect(() => {
    if (userId && user?.id && userId === user.id) {
      navigate(ROUTES.PROFILE, { replace: true })
    }
  }, [userId, user?.id, navigate])

  const { data, isLoading, isError } = usePublicProfile(userId, user?.id)
  const { data: reviewsData, isLoading: reviewsLoading } = useMyReviews(userId, { page })

  const sendRequest = useSendFriendRequest()
  const respond = useRespondFriendRequest()
  const unfriend = useUnfriend()

  function handleSendRequest() {
    if (!user?.id || !userId) return
    sendRequest.mutate({ requesterId: user.id, addresseeId: userId })
  }

  function handleAccept(friendshipId: string) {
    if (!user?.id) return
    respond.mutate({ friendshipId, status: 'accepted', userId: user.id })
  }

  function handleUnfriend(friendshipId: string) {
    if (!user?.id) return
    unfriend.mutate({ friendshipId, userId: user.id })
  }

  if (isLoading) return <AppLayout><ProfileSkeleton /></AppLayout>

  if (isError || !data) {
    return (
      <AppLayout>
        <EmptyState
          title="Profile not found"
          message="This user doesn't exist or their profile is unavailable."
          action={{ label: 'Go back', onClick: () => navigate(-1) }}
          icon={<UserPlus className="w-8 h-8 text-primary" />}
        />
      </AppLayout>
    )
  }

  const { profile, reviewCount, avgScore, friendshipId, friendshipStatus } = data
  const displayName = profile.username ?? profile.id
  const initial = displayName[0].toUpperCase()
  const memberSince = format(new Date(profile.created_at), 'MMMM yyyy')

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </button>

        {/* Profile header */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-start gap-4 mb-6">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-primary">{initial}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-secondary">@{displayName}</p>
              <p className="text-sm text-text-muted">Member since {memberSince}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 divide-x divide-border mb-6">
            <div className="pr-4">
              <p className="text-2xl font-bold text-secondary">{reviewCount}</p>
              <p className="text-xs text-text-muted mt-0.5">Reviews</p>
            </div>
            <div className="pl-4">
              <p className="text-2xl font-bold text-secondary">
                {avgScore != null ? avgScore.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-text-muted mt-0.5">Avg Score</p>
            </div>
          </div>

          {/* Friendship action */}
          <FriendshipAction
            status={friendshipStatus}
            friendshipId={friendshipId}
            isLoading={sendRequest.isPending || respond.isPending || unfriend.isPending}
            onSendRequest={handleSendRequest}
            onAccept={handleAccept}
            onUnfriend={handleUnfriend}
          />
        </div>

        {/* Reviews section */}
        <section>
          <h2 className="text-lg font-semibold text-secondary mb-3">
            {displayName}'s Reviews
          </h2>

          {reviewsLoading ? (
            <SkeletonLoader variant="list" count={3} />
          ) : reviewsData?.reviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              message={`${displayName} hasn't reviewed any restaurants yet.`}
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
