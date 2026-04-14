import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { Review } from '@/types/database.types'

export function useUserReview(restaurantId: string, userId: string | undefined) {
  return useQuery<Review | null>({
    queryKey: QUERY_KEYS.USER_REVIEW(restaurantId),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = (await (supabase.from('reviews') as any)
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('user_id', userId!)
        .maybeSingle()) as { data: Review | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!userId,
  })
}
