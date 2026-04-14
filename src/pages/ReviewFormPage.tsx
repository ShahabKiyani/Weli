import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRestaurant } from '@/hooks/useRestaurant'
import { useUserReview } from '@/hooks/useUserReview'
import { useSubmitReview } from '@/hooks/useSubmitReview'
import { useUpdateReview } from '@/hooks/useUpdateReview'
import { useDeleteReview } from '@/hooks/useDeleteReview'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useToast } from '@/components/Toast'
import { AppLayout } from '@/components/AppLayout'
import { ScoreSelector } from '@/components/ScoreSelector'
import { Button } from '@/components/Button'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ROUTES } from '@/lib/constants'

const MAX_COMMENT = 500

export default function ReviewFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const { data: restaurant } = useRestaurant(id)
  const { data: existingReview, isLoading: reviewLoading } = useUserReview(id ?? '', user?.id)

  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const submitMutation = useSubmitReview()
  const updateMutation = useUpdateReview()
  const deleteMutation = useDeleteReview()

  const isEdit = !!existingReview
  useDocumentTitle(isEdit ? 'Edit Review' : 'Leave a Review')
  const isPending =
    submitMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // Pre-fill form when editing an existing review
  useEffect(() => {
    if (existingReview) {
      setScore(existingReview.score)
      setComment(existingReview.comment ?? '')
    }
  }, [existingReview])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!score || !user || !id) return

    try {
      if (isEdit && existingReview) {
        await updateMutation.mutateAsync({
          reviewId: existingReview.id,
          restaurantId: id,
          score,
          comment: comment.trim() || null,
        })
      } else {
        await submitMutation.mutateAsync({
          restaurantId: id,
          userId: user.id,
          score,
          comment: comment.trim() || null,
        })
      }
      showToast(isEdit ? 'Review updated!' : 'Review submitted!', 'success')
      navigate(ROUTES.RESTAURANT_DETAIL(id))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      showToast(message, 'error')
    }
  }

  async function handleDelete() {
    if (!existingReview || !id) return
    setShowDeleteModal(false)
    try {
      await deleteMutation.mutateAsync({ reviewId: existingReview.id, restaurantId: id })
      showToast('Review deleted.', 'success')
      navigate(ROUTES.RESTAURANT_DETAIL(id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete review.'
      showToast(message, 'error')
    }
  }

  // Show loading state while checking for an existing review
  if (reviewLoading) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto py-8 space-y-4">
          <div className="animate-pulse bg-border rounded-lg h-8 w-48" aria-hidden="true" />
          <div className="animate-pulse bg-border rounded-lg h-64 w-full" aria-hidden="true" />
        </div>
      </AppLayout>
    )
  }

  const restaurantName = restaurant?.name ?? 'Restaurant'

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto py-6 space-y-6">
        {/* Back link */}
        {id && (
          <Link
            to={ROUTES.RESTAURANT_DETAIL(id)}
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Back to {restaurantName}
          </Link>
        )}

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-wider text-text-muted font-medium mb-1">
            {restaurantName}
          </p>
          <h1 className="text-2xl font-bold text-secondary">
            {isEdit ? 'Edit Your Review' : 'Leave a Review'}
          </h1>
        </div>

        {/* Review form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Score picker */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-text">
              Your Score <span className="text-error" aria-hidden="true">*</span>
            </label>
            <ScoreSelector value={score} onChange={setScore} />
          </div>

          {/* Comment */}
          <div className="space-y-1">
            <label htmlFor="review-comment" className="block text-sm font-semibold text-text">
              Comment <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              id="review-comment"
              aria-label="Comment"
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= MAX_COMMENT) setComment(e.target.value)
              }}
              rows={4}
              placeholder="Share your experience…"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
            <p className="text-xs text-text-muted text-right">
              {comment.length}/{MAX_COMMENT}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              variant="primary"
              loading={isPending}
              disabled={!score || isPending}
              className="w-full"
            >
              {isEdit ? 'Update Review' : 'Submit Review'}
            </Button>

            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteModal(true)}
                disabled={isPending}
                className="w-full text-error border-error/40 hover:bg-error/5"
              >
                Delete Review
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Review"
        message="Are you sure you want to delete your review? This cannot be undone."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </AppLayout>
  )
}
