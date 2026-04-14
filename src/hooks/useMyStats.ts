import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'

export interface MyStats {
  reviewCount: number
  avgScore: number | null
}

export function useMyStats(userId: string | undefined) {
  return useQuery<MyStats>({
    queryKey: [QUERY_KEYS.MY_STATS, userId],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('reviews')
        .select('score')
        .eq('user_id', userId!)) as {
        data: { score: number }[] | null
        error: { code: string; message: string } | null
      }

      if (error) throw new Error(error.message)

      const scores = data ?? []
      const reviewCount = scores.length
      const avgScore =
        reviewCount > 0 ? scores.reduce((sum, r) => sum + r.score, 0) / reviewCount : null

      return { reviewCount, avgScore }
    },
    enabled: !!userId,
  })
}
