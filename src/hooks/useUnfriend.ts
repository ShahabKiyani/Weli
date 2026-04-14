import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'

export interface UnfriendInput {
  friendshipId: string
  userId: string
}

/**
 * Mutation that deletes a friendship row (unfriend or cancel a sent request).
 * Either party may perform this action (enforced by RLS via the delete policy).
 * Invalidates friends and suggested-friends caches on success.
 */
export function useUnfriend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ friendshipId }: UnfriendInput) => {
      const { error } = (await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)) as { error: { code: string; message: string } | null }

      if (error) throw new Error(error.message)
    },

    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUGGESTED_FRIENDS(userId) })
    },
  })
}
