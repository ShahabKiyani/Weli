import { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, className = '', ...props }, ref) => {
    const errorId = `${id}-error`

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-semibold text-text">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={[
            'w-full rounded-lg border px-3 py-2.5 text-sm text-text bg-card',
            'placeholder:text-text-muted outline-none transition-colors',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            error ? 'border-error' : 'border-border',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
