import { UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/Button'

export interface EmptyStateProps {
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
}

export function EmptyState({ title, message, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mb-4">
        {icon ?? <UtensilsCrossed className="w-8 h-8 text-primary" aria-hidden="true" />}
      </div>
      <h2 className="text-lg font-bold text-secondary mb-2">{title}</h2>
      <p className="text-sm text-text-muted max-w-xs mb-6">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  )
}
