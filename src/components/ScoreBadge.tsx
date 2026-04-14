type ScoreTier = 'low' | 'mid' | 'high'
type Variant = 'circle' | 'pill'

function getScoreTier(score: number): ScoreTier {
  if (score <= 3) return 'low'
  if (score <= 6) return 'mid'
  return 'high'
}

// Complete class strings so Tailwind's scanner can detect them at build time
const tierClasses: Record<ScoreTier, string> = {
  low: 'bg-error text-white',
  mid: 'bg-warning text-white',
  high: 'bg-primary text-white',
}

export interface ScoreBadgeProps {
  score: number
  variant?: Variant
  className?: string
}

export function ScoreBadge({ score, variant = 'circle', className = '' }: ScoreBadgeProps) {
  const tier = getScoreTier(score)

  if (variant === 'circle') {
    return (
      <div
        data-variant="circle"
        data-score-tier={tier}
        className={[
          'w-12 h-12 rounded-full flex items-center justify-center',
          'text-base font-bold flex-shrink-0',
          tierClasses[tier],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {score}
      </div>
    )
  }

  return (
    <span
      data-variant="pill"
      data-score-tier={tier}
      className={[
        'inline-flex items-center justify-center rounded-full px-2.5 py-0.5',
        'text-xs font-bold',
        tierClasses[tier],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {score}
    </span>
  )
}
