import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useFriendFeed } from '@/hooks/useFriendFeed'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AppLayout } from '@/components/AppLayout'
import { FeedItem } from '@/components/FeedItem'
import { FeedEmptyState } from '@/components/FeedEmptyState'
import { SkeletonLoader } from '@/components/SkeletonLoader'
import { Pagination } from '@/components/Pagination'

export default function FeedPage() {
  useDocumentTitle('Feed')
  const { user } = useAuth()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useFriendFeed(user?.id, { page })

  const showEmpty = !isLoading && (data?.entries.length ?? 0) === 0

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-secondary">Feed</h1>

        {isLoading ? (
          <div role="status" aria-label="Loading feed">
            <SkeletonLoader variant="list" count={4} />
          </div>
        ) : showEmpty ? (
          <FeedEmptyState />
        ) : (
          <>
            <div className="space-y-3">
              {data?.entries.map((entry) => (
                <FeedItem key={entry.review_id} entry={entry} />
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={data.totalPages}
                onPageChange={setPage}
                className="mt-6"
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
