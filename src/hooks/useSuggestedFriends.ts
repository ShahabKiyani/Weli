import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { Friendship, Profile } from '@/types/database.types'

export interface SuggestedFriend {
  profile: Profile
  /**
   * Number of mutual friends between the current user and the suggested user.
   * MVP note: This is always 0 for now because RLS prevents reading another
   * user's friendship rows. True mutual-friend counting requires a server-side
   * Postgres RPC with SECURITY DEFINER (planned for a future phase).
   */
  mutualCount: number
}

type FriendshipWithProfiles = Friendship & {
  requester: Profile
  addressee: Profile
}

/**
 * Returns up to 5 suggested profiles for the current user.
 * Suggestions are profiles that are not the current user and not already friends.
 *
 * The mutualCount field is always 0 in this MVP implementation due to RLS
 * constraints that prevent querying other users' friendship rows.
 */
export function useSuggestedFriends(userId: string | undefined) {
  return useQuery<SuggestedFriend[]>({
    queryKey: QUERY_KEYS.SUGGESTED_FRIENDS(userId ?? ''),
    queryFn: async () => {
      // Step 1: Get current user's accepted friend IDs
      const { data: friendships, error: friendshipError } = (await supabase
        .from('friendships')
        .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted')) as {
        data: FriendshipWithProfiles[] | null
        error: { message: string } | null
      }

      if (friendshipError) throw new Error(friendshipError.message)

      const existingFriendIds = new Set<string>([userId!])
      for (const f of friendships ?? []) {
        existingFriendIds.add(f.requester_id)
        existingFriendIds.add(f.addressee_id)
      }

      // Step 2: Fetch profiles NOT in the excluded set, limit to 5
      const excludeIds = Array.from(existingFriendIds)
      const { data: profiles, error: profileError } = (await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(5)) as { data: Profile[] | null; error: { message: string } | null }

      if (profileError) throw new Error(profileError.message)

      return (profiles ?? [])
        .filter((p) => p.id !== userId)
        .map((profile): SuggestedFriend => ({ profile, mutualCount: 0 }))
    },
    enabled: !!userId,
  })
}
