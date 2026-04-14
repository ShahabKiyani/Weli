import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'

export interface RespondFriendRequestInput {
  friendshipId: string
  status: 'accepted' | 'declined'
  userId: string
}

/**
 * Mutation that updates the status of a friendship row to 'accepted' or 'declined'.
 * Only the addressee may perform this action (enforced by RLS on the server).
 * Invalidates friends, friend-requests, and suggested-friends caches on success.
 */
export function useRespondFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ friendshipId, status }: RespondFriendRequestInput) => {
      const { error } = (await supabase
        .from('friendships')
        .update({ status })
        .eq('id', friendshipId)) as { error: { code: string; message: string } | null }

      if (error) throw new Error(error.message)
    },

    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIEND_REQUESTS(userId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUGGESTED_FRIENDS(userId) })
    },
  })
}
