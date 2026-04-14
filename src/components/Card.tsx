import { forwardRef } from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          'bg-card border border-border rounded-2xl',
          hoverable &&
            'cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'
