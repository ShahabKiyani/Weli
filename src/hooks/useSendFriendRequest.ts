import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import { SUPABASE_ERROR_CODES } from '@/lib/errors'

export interface SendFriendRequestInput {
  requesterId: string
  addresseeId: string
}

/**
 * Mutation that inserts a new friendship row with status 'pending'.
 * On duplicate (23505) the error message is surfaced as "Friend request already sent"
 * so the UI can show a toast rather than a generic error.
 */
export function useSendFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requesterId, addresseeId }: SendFriendRequestInput) => {
      const { error } = (await supabase.from('friendships').insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
      })) as { error: { code: string; message: string } | null }

      if (error) {
        if (error.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION) {
          throw new Error('Friend request already sent')
        }
        throw new Error(error.message)
      }
    },

    onSuccess: (_data, { requesterId, addresseeId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS(requesterId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIEND_REQUESTS(addresseeId) })
      queryClient.invalidateQueries({ queryKey: ['search-users'] })
    },
  })
}
