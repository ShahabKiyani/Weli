import type { ReactNode } from 'react'
import { format } from 'date-fns'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database.types'
import type { MyStats } from '@/hooks/useMyStats'

interface UserStatsCardProps {
  user: User | null
  profile: Profile | null
  stats: MyStats | undefined
  loading: boolean
  /** Accepted friends count; omit or pass while friends query is loading to show "—" in the Friends cell */
  friendsCount?: number
  /** Rendered below the avatar on My Profile (e.g. Change photo) */
  avatarAction?: ReactNode
}

export function UserStatsCard({
  user,
  profile,
  stats,
  loading,
  friendsCount,
  avatarAction,
}: UserStatsCardProps) {
  if (loading) {
    return (
      <div role="status" aria-label="Loading stats" className="bg-card rounded-2xl border border-border p-6 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-surface shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-surface rounded w-32" />
            <div className="h-3 bg-surface rounded w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border">
          {[0, 1, 2].map((i) => (
            <div key={i} className="px-4 first:pl-0 last:pr-0 space-y-1">
              <div className="h-6 bg-surface rounded w-12" />
              <div className="h-3 bg-surface rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const avatarUrl = profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined)
  const displayName = profile?.username ?? user?.email?.split('@')[0] ?? 'User'
  const initial = displayName.charAt(0).toUpperCase()
  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), 'MMMM yyyy')
    : '—'

  const avgDisplay =
    stats?.avgScore != null ? stats.avgScore.toFixed(1) : '—'
  const countDisplay = stats?.reviewCount ?? '—'
  const friendsDisplay = friendsCount === undefined ? '—' : String(friendsCount)

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex flex-col items-center gap-2 shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{initial}</span>
            </div>
          )}
          {avatarAction}
        </div>
        <div>
          <p className="font-semibold text-secondary">@{displayName}</p>
          <p className="text-sm text-text-muted">Member since {memberSince}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border">
        <StatCell label="Reviews" value={String(countDisplay)} />
        <StatCell label="Avg Score" value={String(avgDisplay)} />
        <StatCell label="Friends" value={friendsDisplay} />
      </div>
    </div>
  )
}

interface StatCellProps {
  label: string
  value: string
}

function StatCell({ label, value }: StatCellProps) {
  return (
    <div className="px-4 first:pl-0 last:pr-0">
      <p className="font-bold text-secondary text-xl sm:text-2xl">{value}</p>
      <p className="text-xs text-text-muted mt-0.5">{label}</p>
    </div>
  )
}
