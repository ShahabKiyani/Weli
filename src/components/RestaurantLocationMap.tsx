import { ExternalLink, MapPin } from 'lucide-react'
import { Map, AdvancedMarker, useApiLoadingStatus } from '@vis.gl/react-google-maps'
import { useMapAuthError } from '@/hooks/useMapAuthError'
import type { RestaurantStats } from '@/types/database.types'

interface RestaurantLocationMapProps {
  restaurant: RestaurantStats
  className?: string
}

export function RestaurantLocationMap({ restaurant, className = '' }: RestaurantLocationMapProps) {
  const status = useApiLoadingStatus()
  const authError = useMapAuthError()
  const directionsUrl = buildDirectionsUrl(restaurant)
  const mapUnavailable = status === 'FAILED' || status === 'AUTH_FAILURE' || authError

  return (
    <div className={className}>
      <div className="rounded-xl overflow-hidden border border-border h-[200px]">
        {mapUnavailable ? (
          <MapUnavailableFallback name={restaurant.name} address={restaurant.address} />
        ) : (
          <Map
            defaultCenter={{ lat: restaurant.latitude, lng: restaurant.longitude }}
            defaultZoom={16}
            gestureHandling="none"
            disableDefaultUI
            style={{ width: '100%', height: '100%' }}
            aria-label={`Map showing ${restaurant.name}`}
          >
            <AdvancedMarker
              position={{ lat: restaurant.latitude, lng: restaurant.longitude }}
              title={restaurant.name}
            />
          </Map>
        )}
      </div>

      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ExternalLink className="w-4 h-4" aria-hidden="true" />
        Get Directions
      </a>
    </div>
  )
}

function MapUnavailableFallback({ name, address }: { name: string; address: string }) {
  return (
    <div className="w-full h-full bg-surface flex flex-col items-center justify-center gap-2 text-center px-4">
      <MapPin className="w-8 h-8 text-text-muted opacity-40" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-text">{name}</p>
        <p className="text-xs text-text-muted mt-0.5">{address}</p>
      </div>
      <p className="text-xs text-text-muted mt-1">
        Map unavailable
      </p>
    </div>
  )
}

function buildDirectionsUrl(restaurant: RestaurantStats): string {
  const base = 'https://www.google.com/maps/dir/?api=1'
  const dest = `&destination=${encodeURIComponent(restaurant.address)}`
  const placeId = restaurant.google_place_id
    ? `&destination_place_id=${restaurant.google_place_id}`
    : ''
  return `${base}${dest}${placeId}`
}
