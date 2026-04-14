import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { Friendship, Profile } from '@/types/database.types'

export interface FriendProfile {
  friendshipId: string
  profile: Profile
}

type FriendshipWithProfiles = Friendship & {
  requester: Profile
  addressee: Profile
}

/**
 * Fetches all accepted friendships for a user and normalizes them to a flat
 * list of friend profiles. The "other" party (not the current user) is
 * returned so callers never need to do the requester/addressee disambiguation.
 */
export function useFriends(userId: string | undefined) {
  return useQuery<FriendProfile[]>({
    queryKey: QUERY_KEYS.FRIENDS(userId ?? ''),
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('friendships')
        .select('*, requester:profiles!requester_id(*), addressee:profiles!addressee_id(*)')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted')) as {
        data: FriendshipWithProfiles[] | null
        error: { message: string } | null
      }

      if (error) throw new Error(error.message)

      return (data ?? [])
        .map((row): FriendProfile | null => {
          const friendProfile =
            row.requester_id === userId ? row.addressee : row.requester
          // Guard: skip malformed rows where the resolved friend is the current user
          if (friendProfile.id === userId) return null
          return { friendshipId: row.id, profile: friendProfile }
        })
        .filter((f): f is FriendProfile => f !== null)
    },
    enabled: !!userId,
  })
}
