import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
}

export interface ToastContextValue {
  toasts: ToastItem[]
  showToast: (message: string, type: ToastType) => void
  dismissToast: (id: string) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ── Single toast element ──────────────────────────────────────────────────────

const typeClasses: Record<ToastType, string> = {
  success: 'bg-success text-white',
  error: 'bg-error text-white',
}

function ToastElement({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const Icon = toast.type === 'success' ? CheckCircle : AlertCircle

  return (
    <div
      role="status"
      data-type={toast.type}
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[260px] max-w-sm',
        typeClasses[toast.type],
      ].join(' ')}
    >
      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Container ─────────────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastElement key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => dismissToast(id), 4000)
    },
    [dismissToast],
  )

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
