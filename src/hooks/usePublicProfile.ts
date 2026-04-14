import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { Friendship, FriendshipStatus, Profile } from '@/types/database.types'

export interface PublicProfileData {
  profile: Profile
  reviewCount: number
  avgScore: number | null
  friendshipId: string | null
  friendshipStatus: FriendshipStatus
  /**
   * Number of mutual friends. Always 0 in this MVP — true computation requires a
   * Postgres RPC with SECURITY DEFINER since RLS blocks reading others' friendship rows.
   */
  mutualCount: number
}

type FriendshipRow = Pick<Friendship, 'id' | 'requester_id' | 'addressee_id' | 'status'>

/**
 * Fetches a public profile together with:
 * - Review stats (count + average score)
 * - Friendship status between currentUser and the target
 *
 * All three queries are run sequentially inside a single queryFn so TanStack
 * Query caches the composite result under one key.
 */
export function usePublicProfile(
  targetUserId: string | undefined,
  currentUserId: string | undefined,
) {
  return useQuery<PublicProfileData>({
    queryKey: QUERY_KEYS.PUBLIC_PROFILE(targetUserId ?? ''),
    queryFn: async () => {
      // 1. Fetch the target profile
      const { data: profiles, error: profileError } = (await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId!)
        .limit(1)) as { data: Profile[] | null; error: { message: string } | null }

      if (profileError) throw new Error(profileError.message)
      const profile = profiles?.[0]
      if (!profile) throw new Error('Profile not found')

      // 2. Fetch review scores to compute stats
      const { data: reviews, error: reviewError } = (await supabase
        .from('reviews')
        .select('score')
        .eq('user_id', targetUserId!)) as {
        data: { score: number }[] | null
        error: { message: string } | null
      }

      if (reviewError) throw new Error(reviewError.message)
      const scores = reviews ?? []
      const reviewCount = scores.length
      const avgScore =
        reviewCount > 0 ? scores.reduce((sum, r) => sum + r.score, 0) / reviewCount : null

      // 3. Fetch current user's friendships to determine relationship with target
      const { data: friendships, error: friendshipError } = (await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, status')
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)) as {
        data: FriendshipRow[] | null
        error: { message: string } | null
      }

      if (friendshipError) throw new Error(friendshipError.message)

      // Find the specific friendship involving the target user
      const friendship =
        (friendships ?? []).find(
          (f) => f.requester_id === targetUserId || f.addressee_id === targetUserId,
        ) ?? null

      let friendshipStatus: FriendshipStatus = 'none'
      let friendshipId: string | null = null

      if (friendship) {
        friendshipId = friendship.id
        if (friendship.status === 'accepted') {
          friendshipStatus = 'accepted'
        } else if (friendship.requester_id === currentUserId) {
          friendshipStatus = 'pending_sent'
        } else {
          friendshipStatus = 'pending_received'
        }
      }

      return { profile, reviewCount, avgScore, friendshipId, friendshipStatus, mutualCount: 0 }
    },
    enabled: !!targetUserId && !!currentUserId,
  })
}
