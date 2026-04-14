import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PAGINATION, QUERY_KEYS } from '@/lib/constants'
import { useFriends } from '@/hooks/useFriends'
import type { FriendFeedEntry } from '@/types/database.types'

export interface FriendFeedResult {
  entries: FriendFeedEntry[]
  total: number
  totalPages: number
}

export interface UseFriendFeedOptions {
  page?: number
}

/**
 * Loads friend review activity for the feed: resolves accepted friend IDs via
 * `useFriends`, then queries the `friend_feed` view restricted to those users,
 * ordered by `created_at` descending, with server-side pagination (20 per page).
 */
export function useFriendFeed(userId: string | undefined, options: UseFriendFeedOptions = {}) {
  const { page = 1 } = options
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE

  const { data: friends, isLoading: friendsLoading } = useFriends(userId)
  const friendIds = friends?.map((f) => f.profile.id) ?? []
  const friendIdsKey = [...friendIds].sort().join(',')

  const feedQuery = useQuery<FriendFeedResult>({
    queryKey: [...QUERY_KEYS.FRIEND_FEED(userId ?? ''), page, friendIdsKey],
    queryFn: async () => {
      if (friendIds.length === 0) {
        return { entries: [], total: 0, totalPages: 0 }
      }

      const from = (page - 1) * pageSize
      const to = page * pageSize - 1

      const { data, error, count } = (await supabase
        .from('friend_feed')
        .select('*', { count: 'exact' })
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .range(from, to)) as {
        data: FriendFeedEntry[] | null
        error: { message: string } | null
        count: number | null
      }

      if (error) throw new Error(error.message)

      const total = count ?? 0
      return {
        entries: data ?? [],
        total,
        totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
      }
    },
    enabled: !!userId && !friendsLoading,
  })

  const isLoading = !!userId && (friendsLoading || feedQuery.isLoading)

  return {
    ...feedQuery,
    isLoading,
  }
}
