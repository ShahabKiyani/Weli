import { useEffect, useId, useRef } from 'react'
import { Button } from '@/components/Button'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: ConfirmModalProps) {
  const titleId = useId()
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Keyboard: close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  // Focus management: trap focus to cancel button on open; restore on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      cancelButtonRef.current?.focus()
    } else {
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        data-testid="modal-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-bold text-text mb-2">
          {title}
        </h2>
        <p className="text-sm text-text-muted mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button ref={cancelButtonRef} variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
