import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Map, AdvancedMarker, InfoWindow, useApiLoadingStatus } from '@vis.gl/react-google-maps'
import { useMapAuthError } from '@/hooks/useMapAuthError'
import type { RestaurantWithDistance } from '@/types/database.types'
import { ScoreBadge } from '@/components/ScoreBadge'
import { AMHERST_CENTER, MAP_DEFAULTS, ROUTES } from '@/lib/constants'

interface RestaurantMapProps {
  restaurants: RestaurantWithDistance[]
  center?: { lat: number; lng: number } | null
  highlightedId?: string | null
  onMarkerHover?: (id: string | null) => void
}

export function RestaurantMap({
  restaurants,
  center,
  highlightedId,
  onMarkerHover,
}: RestaurantMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const status = useApiLoadingStatus()
  const authError = useMapAuthError()
  const selectedRestaurant = restaurants.find((r) => r.id === selectedId)
  const mapCenter = center ?? AMHERST_CENTER

  if (status === 'FAILED' || status === 'AUTH_FAILURE' || authError) {
    return (
      <div className="rounded-xl border border-border bg-surface h-[350px] sm:h-[500px] flex flex-col items-center justify-center gap-3 text-center px-6">
        <MapPin className="w-10 h-10 text-text-muted opacity-30" aria-hidden="true" />
        <div>
          <p className="font-semibold text-text">Map unavailable</p>
          <p className="text-sm text-text-muted mt-1">
            Enable the Maps JavaScript API in Google Cloud Console and ensure billing is active.
          </p>
        </div>
        <p className="text-xs text-text-muted">{restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} found — switch to list view to browse</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border h-[350px] sm:h-[500px]">
      <Map
        defaultCenter={mapCenter}
        defaultZoom={MAP_DEFAULTS.zoom}
        gestureHandling="cooperative"
        mapId="weli-discover-map"
        style={{ width: '100%', height: '100%' }}
        aria-label="Restaurant map"
      >
        {restaurants.map((r) => (
          <AdvancedMarker
            key={r.id}
            position={{ lat: r.latitude, lng: r.longitude }}
            title={r.name}
            onClick={() => setSelectedId(r.id)}
          >
            <div
              data-testid={`marker-content-${r.id}`}
              data-highlighted={String(highlightedId === r.id)}
              role="button"
              tabIndex={0}
              aria-label={`${r.name}, score ${Math.round(r.avg_score)}`}
              onMouseEnter={() => onMarkerHover?.(r.id)}
              onMouseLeave={() => onMarkerHover?.(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedId(r.id)
                }
              }}
              className={[
                'transition-transform cursor-pointer',
                highlightedId === r.id ? 'scale-125' : 'scale-100',
              ].join(' ')}
            >
              <ScoreBadge score={Math.round(r.avg_score)} variant="circle" />
            </div>
          </AdvancedMarker>
        ))}

        {selectedRestaurant && (
          <InfoWindow
            position={{ lat: selectedRestaurant.latitude, lng: selectedRestaurant.longitude }}
            onCloseClick={() => setSelectedId(null)}
          >
            <div className="p-1 min-w-[140px]">
              <p className="font-semibold text-secondary text-sm">{selectedRestaurant.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{selectedRestaurant.cuisine_type}</p>
              <div className="mt-1">
                <ScoreBadge score={Math.round(selectedRestaurant.avg_score)} variant="pill" />
              </div>
              <Link
                to={ROUTES.RESTAURANT_DETAIL(selectedRestaurant.id)}
                className="mt-2 block text-xs font-medium text-primary hover:underline"
              >
                View Details →
              </Link>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  )
}
