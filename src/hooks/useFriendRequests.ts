import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { Friendship, Profile } from '@/types/database.types'

export type FriendshipWithRequester = Friendship & { requester: Profile }

/**
 * Fetches all incoming pending friend requests for the current user
 * (rows where addressee_id = userId and status = 'pending').
 * Each row includes the requester's profile data.
 */
export function useFriendRequests(userId: string | undefined) {
  return useQuery<FriendshipWithRequester[]>({
    queryKey: QUERY_KEYS.FRIEND_REQUESTS(userId ?? ''),
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('friendships')
        .select('*, requester:profiles!requester_id(*)')
        .eq('addressee_id', userId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })) as {
        data: FriendshipWithRequester[] | null
        error: { message: string } | null
      }

      if (error) throw new Error(error.message)
      return data ?? []
    },
    enabled: !!userId,
  })
}
