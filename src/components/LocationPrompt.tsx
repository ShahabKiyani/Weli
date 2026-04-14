import { MapPin, X } from 'lucide-react'

interface LocationPromptProps {
  onAllow: () => void
  onDismiss: () => void
  className?: string
}

export function LocationPrompt({ onAllow, onDismiss, className = '' }: LocationPromptProps) {
  return (
    <div
      role="banner"
      className={`flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 ${className}`}
    >
      <MapPin className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm text-secondary">
        <span className="font-semibold">Enable location</span> for distance sorting
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onAllow}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Allow
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss location prompt"
          className="rounded-lg p-1.5 text-text-muted hover:bg-surface transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
