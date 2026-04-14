import { MapPin, Plus, Loader2 } from 'lucide-react'
import type { PlaceCandidate } from '@/lib/places'

interface PlacesResultsProps {
  places: PlaceCandidate[]
  isSearching: boolean
  onImport: (place: PlaceCandidate) => void
  importingId: string | null
}

function PlacesSkeletonItem() {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-surface shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 bg-surface rounded w-2/3" />
        <div className="h-3 bg-surface rounded w-1/2" />
        <div className="h-3 bg-surface rounded w-1/4" />
      </div>
      <div className="h-7 w-20 rounded-lg bg-surface shrink-0" />
    </li>
  )
}

export function PlacesResults({ places, isSearching, onImport, importingId }: PlacesResultsProps) {
  if (!isSearching && places.length === 0) return null

  return (
    <section className="mt-4 space-y-3" aria-label="Google Maps results">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-secondary">From Google Maps</h2>
      </div>

      {isSearching ? (
        <ul className="space-y-2" aria-label="Loading results">
          <PlacesSkeletonItem />
          <PlacesSkeletonItem />
          <PlacesSkeletonItem />
        </ul>
      ) : (
        <ul className="space-y-2">
          {places.map((place) => {
            const importing = importingId === place.place_id
            return (
              <li
                key={place.place_id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                {/* Thumbnail / placeholder */}
                <div className="w-12 h-12 rounded-lg bg-surface shrink-0 overflow-hidden">
                  {place.image_url ? (
                    <img
                      src={place.image_url}
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-lg">
                      🍽️
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-secondary truncate">{place.name}</p>
                  <p className="text-xs text-text-muted truncate">{place.address}</p>
                  <span className="inline-block mt-0.5 rounded-full bg-surface border border-border px-2 py-0.5 text-[10px] text-text-muted">
                    {place.cuisine_type}
                  </span>
                </div>

                {/* Import button */}
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => onImport(place)}
                  aria-label={`Add ${place.name} to Weli`}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  Add to Weli
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-[10px] text-text-muted text-center pt-1">
        Powered by Google Maps — restaurant data &copy; Google
      </p>
    </section>
  )
}
