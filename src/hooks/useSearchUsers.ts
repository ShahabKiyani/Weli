import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { QUERY_KEYS } from '@/lib/constants'
import type { Friendship, FriendshipStatus, Profile } from '@/types/database.types'

export type { FriendshipStatus }

export interface SearchedUser {
  profile: Profile
  friendshipId: string | null
  friendshipStatus: FriendshipStatus
}

/**
 * Debounced search of profiles by username (ilike).
 * Excludes the current user and annotates each result with the current
 * friendship status so the UI can render the correct action button.
 *
 * Enable this hook only when the debounced query is >= 2 characters.
 * Use the useDebounce hook in the consuming component.
 */
export function useSearchUsers(currentUserId: string | undefined, query: string) {
  const trimmed = query.trim()
  const enabled = !!currentUserId && trimmed.length >= 2

  return useQuery<SearchedUser[]>({
    queryKey: QUERY_KEYS.SEARCH_USERS(currentUserId ?? '', trimmed),
    queryFn: async () => {
      // 1. Fetch matching profiles (excluding current user)
      const { data: profiles, error: profileError } = (await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${trimmed}%`)
        .neq('id', currentUserId!)
        .limit(10)) as { data: Profile[] | null; error: { message: string } | null }

      if (profileError) throw new Error(profileError.message)
      if (!profiles || profiles.length === 0) return []

      // 2. Fetch all friendships involving the current user (any status) for annotation
      const { data: friendships, error: friendshipError } = (await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, status')
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)) as {
        data: Pick<Friendship, 'id' | 'requester_id' | 'addressee_id' | 'status'>[] | null
        error: { message: string } | null
      }

      if (friendshipError) throw new Error(friendshipError.message)
      const friendshipList = friendships ?? []

      // 3. Build a lookup: otherUserId → friendship row
      const friendshipByOther = new Map(
        friendshipList.map((f) => {
          const otherId = f.requester_id === currentUserId ? f.addressee_id : f.requester_id
          return [otherId, f]
        }),
      )

      // 4. Annotate each profile
      return profiles.map((profile): SearchedUser => {
        const f = friendshipByOther.get(profile.id)
        if (!f) {
          return { profile, friendshipId: null, friendshipStatus: 'none' }
        }

        let friendshipStatus: FriendshipStatus
        if (f.status === 'accepted') {
          friendshipStatus = 'accepted'
        } else if (f.status === 'pending' && f.requester_id === currentUserId) {
          friendshipStatus = 'pending_sent'
        } else {
          friendshipStatus = 'pending_received'
        }

        return { profile, friendshipId: f.id, friendshipStatus }
      })
    },
    enabled,
  })
}
