import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PAGINATION, QUERY_KEYS } from '@/lib/constants'
import type { ReviewWithProfile } from '@/types/database.types'

interface UseRestaurantReviewsOptions {
  page?: number
  pageSize?: number
}

export interface RestaurantReviewsResult {
  reviews: ReviewWithProfile[]
  total: number
  totalPages: number
}

export function useRestaurantReviews(
  restaurantId: string,
  options: UseRestaurantReviewsOptions = {},
) {
  const { page = 1, pageSize = PAGINATION.DEFAULT_PAGE_SIZE } = options
  const from = (page - 1) * pageSize
  const to = page * pageSize - 1

  return useQuery<RestaurantReviewsResult>({
    queryKey: [...QUERY_KEYS.RESTAURANT_REVIEWS(restaurantId), page, pageSize],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error, count } = (await (supabase.from('reviews') as any)
        .select('*, profiles(username, avatar_url)', { count: 'exact' })
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .range(from, to)) as {
        data: ReviewWithProfile[] | null
        error: { message: string } | null
        count: number | null
      }

      if (error) throw new Error(error.message)

      const total = count ?? 0
      return {
        reviews: data ?? [],
        total,
        totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
      }
    },
  })
}
