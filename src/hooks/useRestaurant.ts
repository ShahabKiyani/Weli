import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { RestaurantStats } from '@/types/database.types'

export function useRestaurant(id: string | undefined) {
  return useQuery<RestaurantStats>({
    queryKey: QUERY_KEYS.RESTAURANT(id ?? ''),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = (await (supabase.from('restaurant_stats') as any)
        .select('*')
        .eq('id', id!)
        .single()) as { data: RestaurantStats | null; error: { code: string; message: string } | null }

      if (error) throw new Error(error.message)
      if (!data) throw new Error('Restaurant not found')
      return data
    },
    enabled: !!id,
  })
}
