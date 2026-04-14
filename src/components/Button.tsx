import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'google'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary disabled:bg-primary/50',
  secondary:
    'bg-secondary text-white hover:bg-secondary/90 focus-visible:ring-secondary disabled:bg-secondary/50',
  ghost:
    'bg-transparent text-text border border-border hover:bg-surface focus-visible:ring-primary',
  google: 'bg-white text-text border border-border hover:bg-gray-50 focus-visible:ring-primary',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, disabled, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
          variantClasses[variant],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading && (
          <Loader2 role="status" aria-label="Loading" className="w-4 h-4 animate-spin" />
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
