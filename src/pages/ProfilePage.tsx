import { useRef, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyStats } from '@/hooks/useMyStats'
import { useFriendRequests } from '@/hooks/useFriendRequests'
import { useFriends } from '@/hooks/useFriends'
import { useSuggestedFriends } from '@/hooks/useSuggestedFriends'
import { useRespondFriendRequest } from '@/hooks/useRespondFriendRequest'
import { useUnfriend } from '@/hooks/useUnfriend'
import { useSendFriendRequest } from '@/hooks/useSendFriendRequest'
import { useUploadAvatar } from '@/hooks/useUploadAvatar'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AppLayout } from '@/components/AppLayout'
import { UserStatsCard } from '@/components/UserStatsCard'
import { FriendRequestCard } from '@/components/FriendRequestCard'
import { FriendCard } from '@/components/FriendCard'
import { FindFriendsModal } from '@/components/FindFriendsModal'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import type { Profile } from '@/types/database.types'

export default function ProfilePage() {
  useDocumentTitle('My Profile')
  const { user, profile } = useAuth()
  const [findFriendsOpen, setFindFriendsOpen] = useState(false)

  const { data: stats, isLoading: statsLoading } = useMyStats(user?.id)
  const { data: requests } = useFriendRequests(user?.id)
  const { data: friends, isLoading: friendsLoading } = useFriends(user?.id)
  const uploadAvatar = useUploadAvatar()
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const { data: suggested } = useSuggestedFriends(user?.id)

  const respondMutation = useRespondFriendRequest()
  const unfriendMutation = useUnfriend()
  const sendRequestMutation = useSendFriendRequest()

  function handleAccept(friendshipId: string) {
    if (!user?.id) return
    respondMutation.mutate({ friendshipId, status: 'accepted', userId: user.id })
  }

  function handleDecline(friendshipId: string) {
    if (!user?.id) return
    respondMutation.mutate({ friendshipId, status: 'declined', userId: user.id })
  }

  function handleUnfriend(friendshipId: string) {
    if (!user?.id) return
    unfriendMutation.mutate({ friendshipId, userId: user.id })
  }

  function handleSendRequest(targetProfile: Profile) {
    if (!user?.id) return
    sendRequestMutation.mutate({ requesterId: user.id, addresseeId: targetProfile.id })
  }

  const pendingCount = requests?.length ?? 0

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    uploadAvatar.mutateAsync(file).catch(() => {
      /* toast handled in hook */
    })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-secondary">My Profile</h1>

        <UserStatsCard
          user={user}
          profile={profile}
          stats={stats}
          loading={statsLoading}
          friendsCount={friendsLoading ? undefined : (friends?.length ?? 0)}
          avatarAction={
            <>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                aria-label="Upload profile photo"
                onChange={handleAvatarFileChange}
                disabled={uploadAvatar.isPending}
              />
              <Button
                type="button"
                variant="ghost"
                className="text-xs px-2 py-1 h-auto min-w-0"
                disabled={uploadAvatar.isPending}
                loading={uploadAvatar.isPending}
                onClick={() => avatarFileInputRef.current?.click()}
              >
                Change photo
              </Button>
            </>
          }
        />

        {/* Friend Requests */}
        {pendingCount > 0 && (
          <section aria-label="Friend requests">
            <h2 className="text-lg font-semibold text-secondary mb-3">
              Friend Requests ({pendingCount})
            </h2>
            <div className="space-y-2">
              {requests!.map((req) => (
                <FriendRequestCard
                  key={req.id}
                  request={req}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  isAccepting={
                    respondMutation.isPending &&
                    respondMutation.variables?.friendshipId === req.id &&
                    respondMutation.variables?.status === 'accepted'
                  }
                  isDeclining={
                    respondMutation.isPending &&
                    respondMutation.variables?.friendshipId === req.id &&
                    respondMutation.variables?.status === 'declined'
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Friends */}
        <section aria-label="Friends">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-secondary">
              Friends ({friends?.length ?? 0})
            </h2>
            <Button
              variant="ghost"
              className="text-sm gap-1.5"
              onClick={() => setFindFriendsOpen(true)}
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              Find Friends
            </Button>
          </div>

          {friends?.length === 0 ? (
            <EmptyState
              title="No friends yet"
              message="Search for people you know and send them a friend request!"
              action={{ label: 'Search for Friends', onClick: () => setFindFriendsOpen(true) }}
            />
          ) : (
            <div className="space-y-2">
              {friends?.map((f) => (
                <FriendCard
                  key={f.friendshipId}
                  profile={f.profile}
                  friendshipId={f.friendshipId}
                  status="accepted"
                  onSendRequest={handleSendRequest}
                  onAccept={handleAccept}
                  onUnfriend={handleUnfriend}
                  isLoading={
                    unfriendMutation.isPending &&
                    unfriendMutation.variables?.friendshipId === f.friendshipId
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Suggested Friends */}
        {(suggested?.length ?? 0) > 0 && (
          <section aria-label="Suggested friends">
            <h2 className="text-lg font-semibold text-secondary mb-3">People You May Know</h2>
            <div className="space-y-2">
              {suggested!.map((s) => (
                <FriendCard
                  key={s.profile.id}
                  profile={s.profile}
                  friendshipId={null}
                  status="none"
                  variant="full"
                  mutualCount={s.mutualCount}
                  onSendRequest={handleSendRequest}
                  onAccept={() => {}}
                  onUnfriend={() => {}}
                  isLoading={sendRequestMutation.isPending}
                />
              ))}
            </div>
          </section>
        )}

        <FindFriendsModal
          open={findFriendsOpen}
          onClose={() => setFindFriendsOpen(false)}
          currentUserId={user?.id ?? ''}
        />
      </div>
    </AppLayout>
  )
}
