import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'

export function useCuisines() {
  return useQuery<string[]>({
    queryKey: [QUERY_KEYS.CUISINES],
    queryFn: async () => {
      const { data, error } = (await supabase.from('restaurants').select('cuisine_type')) as {
        data: { cuisine_type: string }[] | null
        error: { message: string } | null
      }
      if (error) throw new Error(error.message)
      return [...new Set((data ?? []).map((r) => r.cuisine_type))].sort()
    },
  })
}
