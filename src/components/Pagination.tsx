import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total]
  }

  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  }

  return [1, '...', current - 1, current, current + 1, '...', total]
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const range = getPaginationRange(page, totalPages)

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-1${className ? ` ${className}` : ''}`}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="p-2 rounded-lg text-text-muted hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </button>

      {range.map((item, idx) =>
        item === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-sm text-text-muted select-none">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            disabled={item === page}
            aria-label={`Page ${item}`}
            aria-current={item === page ? 'page' : undefined}
            className={[
              'min-w-[36px] h-9 rounded-lg text-sm font-semibold transition-colors',
              item === page
                ? 'bg-primary text-white cursor-default'
                : 'text-text hover:bg-surface',
            ].join(' ')}
          >
            {item}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className="p-2 rounded-lg text-text-muted hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
