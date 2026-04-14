import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PAGINATION, QUERY_KEYS } from '@/lib/constants'
import type { ReviewWithRestaurant } from '@/types/database.types'

interface UseMyReviewsOptions {
  page?: number
  pageSize?: number
}

export interface MyReviewsResult {
  reviews: ReviewWithRestaurant[]
  total: number
  totalPages: number
}

export function useMyReviews(userId: string | undefined, options: UseMyReviewsOptions = {}) {
  const { page = 1, pageSize = PAGINATION.DEFAULT_PAGE_SIZE } = options
  const from = (page - 1) * pageSize
  const to = page * pageSize - 1

  return useQuery<MyReviewsResult>({
    queryKey: [QUERY_KEYS.MY_REVIEWS, userId, page, pageSize],
    queryFn: async () => {
      const { data, error, count } = (await supabase
        .from('reviews')
        .select('*, restaurants(id, name, cuisine_type)', { count: 'exact' })
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .range(from, to)) as {
        data: ReviewWithRestaurant[] | null
        error: { code: string; message: string } | null
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
    enabled: !!userId,
  })
}
