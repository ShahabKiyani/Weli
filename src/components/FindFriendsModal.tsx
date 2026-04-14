import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { FriendCard } from '@/components/FriendCard'
import { useDebounce } from '@/hooks/useDebounce'
import { useSearchUsers } from '@/hooks/useSearchUsers'
import { useSendFriendRequest } from '@/hooks/useSendFriendRequest'
import { useRespondFriendRequest } from '@/hooks/useRespondFriendRequest'
import { useUnfriend } from '@/hooks/useUnfriend'
import type { Profile } from '@/types/database.types'

export interface FindFriendsModalProps {
  open: boolean
  onClose: () => void
  currentUserId: string
}

function SearchSkeleton() {
  return (
    <div role="status" aria-label="Searching" className="space-y-2 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 rounded-xl bg-surface" />
      ))}
    </div>
  )
}

/**
 * Modal dialog for searching and adding friends.
 * Accessibility: role=dialog, aria-modal, ESC to close, backdrop click to close,
 * focus auto-moved to input on open, Tab key trapped within the panel.
 */
export function FindFriendsModal({ open, onClose, currentUserId }: FindFriendsModalProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 400)
  const trimmed = debouncedQuery.trim()

  const { data: results, isLoading } = useSearchUsers(currentUserId, debouncedQuery)
  const sendRequest = useSendFriendRequest()
  const respond = useRespondFriendRequest()
  const unfriend = useUnfriend()

  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Reset query and auto-focus input when modal opens/closes
  useEffect(() => {
    if (open) {
      setQuery('')
      // Defer one tick so the element is mounted before focusing
      const id = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [open])

  // ESC to close + Tab focus trap
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute('disabled'))

        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  function handleSendRequest(profile: Profile) {
    sendRequest.mutate({ requesterId: currentUserId, addresseeId: profile.id })
  }

  function handleAccept(friendshipId: string) {
    respond.mutate({ friendshipId, status: 'accepted', userId: currentUserId })
  }

  function handleUnfriend(friendshipId: string) {
    unfriend.mutate({ friendshipId, userId: currentUserId })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Find Friends"
    >
      {/* Backdrop */}
      <div
        data-testid="modal-backdrop"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6 flex flex-col gap-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-secondary">Find Friends</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface hover:text-text transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Search input */}
        <input
          ref={inputRef}
          type="search"
          placeholder="Search by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* Results */}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {trimmed.length < 2 && (
            <p className="text-center text-sm text-text-muted py-6">
              Type at least 2 characters to search
            </p>
          )}

          {trimmed.length >= 2 && isLoading && <SearchSkeleton />}

          {trimmed.length >= 2 && !isLoading && results?.length === 0 && (
            <p className="text-center text-sm text-text-muted py-6">No users found</p>
          )}

          {results?.map(({ profile, friendshipId, friendshipStatus }) => (
            <FriendCard
              key={profile.id}
              profile={profile}
              friendshipId={friendshipId}
              status={friendshipStatus}
              onSendRequest={handleSendRequest}
              onAccept={handleAccept}
              onUnfriend={handleUnfriend}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
