import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { RestaurantInsert, Restaurant } from '@/types/database.types'

export function useImportRestaurant() {
  const qc = useQueryClient()

  return useMutation<Restaurant, Error, RestaurantInsert>({
    mutationFn: async (restaurant) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = (await (supabase as any)
        .from('restaurants')
        .insert(restaurant)
        .select()) as { data: Restaurant[] | null; error: { code: string; message: string } | null }

      if (error) throw new Error(error.message)
      if (!data?.[0]) throw new Error('Insert succeeded but returned no data')
      return data[0]
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.RESTAURANTS] })
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.CUISINES] })
    },
  })
}
