import { List, Map, Search, X } from 'lucide-react'

export type SortOption = 'distance' | 'rating' | 'name'
export type ViewMode = 'list' | 'map'

interface FilterBarProps {
  cuisines: string[]
  activeCuisine: string | null
  sort: SortOption
  view: ViewMode
  locationAvailable: boolean
  search?: string
  onCuisineChange: (cuisine: string | null) => void
  onSortChange: (sort: SortOption) => void
  onViewChange: (view: ViewMode) => void
  onSearchChange?: (value: string) => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'distance', label: 'Closest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'name', label: 'A–Z' },
]

export function FilterBar({
  cuisines,
  activeCuisine,
  sort,
  view,
  locationAvailable,
  search = '',
  onCuisineChange,
  onSortChange,
  onViewChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search restaurants…"
          aria-label="Search restaurants"
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-9 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchChange?.('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {/* Cuisine chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['All', ...cuisines].map((c) => {
          const value = c === 'All' ? null : c
          const active = activeCuisine === value
          return (
            <button
              key={c}
              aria-pressed={active}
              onClick={() => onCuisineChange(value)}
              className={[
                'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors shrink-0',
                active
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-muted hover:bg-primary/10 hover:text-primary border border-border',
              ].join(' ')}
            >
              {c}
            </button>
          )
        })}
      </div>

      {/* Sort + view row */}
      <div className="flex items-center justify-between gap-2">
        {/* Sort toggle */}
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-0.5">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              aria-pressed={sort === value}
              disabled={value === 'distance' && !locationAvailable}
              onClick={() => onSortChange(value)}
              title={value === 'distance' && !locationAvailable ? 'Enable location for distance sorting' : undefined}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                sort === value
                  ? 'bg-card text-secondary shadow-sm'
                  : 'text-text-muted hover:text-secondary',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-0.5">
          <button
            aria-label="List view"
            aria-pressed={view === 'list'}
            onClick={() => onViewChange('list')}
            className={[
              'rounded-md p-1.5 transition-colors',
              view === 'list' ? 'bg-card text-secondary shadow-sm' : 'text-text-muted hover:text-secondary',
            ].join(' ')}
          >
            <List className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            aria-label="Map view"
            aria-pressed={view === 'map'}
            onClick={() => onViewChange('map')}
            className={[
              'rounded-md p-1.5 transition-colors',
              view === 'map' ? 'bg-card text-secondary shadow-sm' : 'text-text-muted hover:text-secondary',
            ].join(' ')}
          >
            <Map className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
