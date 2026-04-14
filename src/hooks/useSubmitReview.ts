import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mapSupabaseError } from '@/lib/errors'
import { QUERY_KEYS } from '@/lib/constants'

export interface SubmitReviewInput {
  restaurantId: string
  userId: string
  score: number
  comment?: string | null
}

export function useSubmitReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ restaurantId, userId, score, comment }: SubmitReviewInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = (await (supabase.from('reviews') as any).insert({
        restaurant_id: restaurantId,
        user_id: userId,
        score,
        comment: comment ?? null,
      })) as { error: { code: string; message: string } | null }

      if (error) throw new Error(mapSupabaseError(error).message)
    },

    onSuccess: (_data, { restaurantId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESTAURANT(restaurantId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESTAURANT_REVIEWS(restaurantId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_REVIEW(restaurantId) })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESTAURANTS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_REVIEWS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_STATS] })
    },
  })
}
