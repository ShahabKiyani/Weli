import { REVIEW_SCORE_LABELS } from '@/lib/constants'

export interface ScoreSelectorProps {
  value: number | null
  onChange: (score: number) => void
}

function getButtonClasses(score: number, selected: boolean): string {
  const base =
    'w-10 h-10 rounded-full font-bold text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  if (!selected) {
    return `${base} bg-surface text-text-muted border border-border hover:border-primary hover:text-primary focus-visible:ring-primary`
  }

  if (score <= 3) {
    return `${base} bg-error text-white scale-110 ring-2 ring-error/30 focus-visible:ring-error`
  }
  if (score <= 6) {
    return `${base} bg-warning text-white scale-110 ring-2 ring-warning/30 focus-visible:ring-warning`
  }
  return `${base} bg-primary text-white scale-110 ring-2 ring-primary/30 focus-visible:ring-primary`
}

export function ScoreSelector({ value, onChange }: ScoreSelectorProps) {
  return (
    <div role="group" aria-label="Score selector" className="space-y-2">
      <div className="flex gap-1.5 justify-between">
        {Array.from({ length: 10 }, (_, i) => {
          const score = i + 1
          const selected = value === score

          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${score} — ${REVIEW_SCORE_LABELS[score]}`}
              onClick={() => onChange(score)}
              className={getButtonClasses(score, selected)}
            >
              {score}
            </button>
          )
        })}
      </div>

      {/* Landmark labels at 1 / 5 / 10 */}
      <div className="flex justify-between text-xs text-text-muted px-0.5">
        <span>{REVIEW_SCORE_LABELS[1]}</span>
        <span>{REVIEW_SCORE_LABELS[5]}</span>
        <span>{REVIEW_SCORE_LABELS[10]}</span>
      </div>
    </div>
  )
}
