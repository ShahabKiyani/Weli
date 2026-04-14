import { useCallback, useRef, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { placeResultToCandidate } from '@/lib/places'
import { AMHERST_CENTER } from '@/lib/constants'
import type { PlaceCandidate } from '@/lib/places'

export interface UsePlacesSearchOptions {
  maxResults?: number
}

interface UsePlacesSearchReturn {
  results: PlaceCandidate[]
  isSearching: boolean
  error: string | null
  search: (query: string) => void
  clear: () => void
}

/**
 * Search Google Places for restaurants near Amherst.
 *
 * `existingPlaceIds` is a Set of google_place_ids already in our DB,
 * used to filter out duplicates from the results.
 *
 * `options.maxResults` caps how many candidates are returned (default 5).
 */
export function usePlacesSearch(
  existingPlaceIds: Set<string>,
  options: UsePlacesSearchOptions = {},
): UsePlacesSearchReturn {
  const { maxResults = 5 } = options

  const placesLib = useMapsLibrary('places')
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null)
  const [results, setResults] = useState<PlaceCandidate[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(
    (query: string) => {
      if (!placesLib) {
        setError('Maps library not loaded')
        return
      }

      // Lazily create PlacesService using a detached div (avoids needing a Map instance)
      if (!serviceRef.current) {
        serviceRef.current = new placesLib.PlacesService(document.createElement('div'))
      }

      setIsSearching(true)
      setError(null)

      serviceRef.current.textSearch(
        {
          query: `${query} restaurant Amherst MA`,
          location: new google.maps.LatLng(AMHERST_CENTER.lat, AMHERST_CENTER.lng),
          radius: 8000,
          type: 'restaurant',
        },
        (places, status) => {
          setIsSearching(false)

          if (
            status !== google.maps.places.PlacesServiceStatus.OK &&
            status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            setError(`Places search failed (${status})`)
            setResults([])
            return
          }

          const candidates = (places ?? [])
            .map(placeResultToCandidate)
            .filter((c) => c.place_id && !existingPlaceIds.has(c.place_id))
            .slice(0, maxResults)

          setResults(candidates)
        },
      )
    },
    [placesLib, existingPlaceIds, maxResults],
  )

  const clear = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { results, isSearching, error, search, clear }
}
