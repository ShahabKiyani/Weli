import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useRestaurants } from '@/hooks/useRestaurants'
import { useCuisines } from '@/hooks/useCuisines'
import { usePlacesSearch } from '@/hooks/usePlacesSearch'
import { useImportRestaurant } from '@/hooks/useImportRestaurant'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AppLayout } from '@/components/AppLayout'
import { LocationPrompt } from '@/components/LocationPrompt'
import { FilterBar } from '@/components/FilterBar'
import { RestaurantCard } from '@/components/RestaurantCard'
import { RestaurantMap } from '@/components/RestaurantMap'
import { PlacesResults } from '@/components/PlacesResults'
import { SkeletonLoader } from '@/components/SkeletonLoader'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { useToast } from '@/components/Toast'
import { PAGINATION } from '@/lib/constants'
import type { SortOption, ViewMode } from '@/components/FilterBar'
import type { PlaceCandidate } from '@/lib/places'

export default function DiscoverPage() {
  useDocumentTitle('Discover')
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('name')
  const [view, setView] = useState<ViewMode>('list')
  const [page, setPage] = useState(1)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  // Persist prompt dismissal so it doesn't reappear on every reload
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('weli_location_dismissed') === 'true',
  )

  const { lat, lng, loading: geoLoading, denied, request } = useGeolocation()

  const { data: restaurantsData, isLoading: restaurantsLoading } = useRestaurants({
    cuisine: activeCuisine,
    search,
    sort,
    page,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    lat,
    lng,
  })

  const { data: cuisines } = useCuisines()

  // Build a Set of google_place_ids already in the DB to de-duplicate Places results
  const existingPlaceIds = useMemo(() => {
    const ids = new Set<string>()
    for (const r of restaurantsData?.allRestaurants ?? []) {
      if (r.google_place_id) ids.add(r.google_place_id)
    }
    return ids
  }, [restaurantsData?.allRestaurants])

  const {
    results: placesResults,
    isSearching: placesSearching,
    search: searchPlaces,
    clear: clearPlaces,
  } = usePlacesSearch(existingPlaceIds, { maxResults: 5 })

  // Debounce the search query so Google Places is not called on every keystroke
  const debouncedSearch = useDebounce(search, 500)

  const importRestaurant = useImportRestaurant()
  const { showToast } = useToast()
  const [importingId, setImportingId] = useState<string | null>(null)

  const handleImport = useCallback(
    async (place: PlaceCandidate) => {
      setImportingId(place.place_id)
      importRestaurant.mutate(
        {
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          cuisine_type: place.cuisine_type,
          google_place_id: place.place_id,
          image_url: place.image_url,
        },
        {
          onSuccess: () => {
            showToast(`${place.name} added!`, 'success')
            setImportingId(null)
          },
          onError: (err) => {
            showToast(err.message, 'error')
            setImportingId(null)
          },
        },
      )
    },
    [importRestaurant, showToast],
  )

  // Reset to name sort if location is denied while distance sort is active
  useEffect(() => {
    if (denied && sort === 'distance') setSort('name')
  }, [denied, sort])

  // Once location is granted (even from cache), clear the dismissed flag so
  // if permission is revoked and re-requested later the prompt can show again
  useEffect(() => {
    if (lat != null) {
      try { localStorage.removeItem('weli_location_dismissed') } catch { /* ignore */ }
    }
  }, [lat])

  // Auto-trigger Google Places search when the debounced query is >= 2 characters.
  // Clear results when the query drops below the threshold.
  useEffect(() => {
    const trimmed = debouncedSearch.trim()
    if (trimmed.length >= 2) {
      searchPlaces(trimmed)
    } else {
      clearPlaces()
    }
  }, [debouncedSearch, searchPlaces, clearPlaces])

  const showLocationPrompt = lat == null && !denied && !dismissed && !geoLoading

  const handleCuisineChange = (c: string | null) => {
    setActiveCuisine(c)
    setPage(1)
  }

  const handleSortChange = (s: SortOption) => {
    setSort(s)
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
    // Immediately clear Places results when query is fully cleared so there's
    // no stale section visible before the debounce fires
    if (!value.trim()) clearPlaces()
  }

  const showPlacesSection = search.trim().length >= 2 && !restaurantsLoading

  return (
    <AppLayout>
      <div className="space-y-4">
        {showLocationPrompt && (
          <LocationPrompt
            onAllow={request}
            onDismiss={() => {
              try { localStorage.setItem('weli_location_dismissed', 'true') } catch { /* ignore */ }
              setDismissed(true)
            }}
          />
        )}

        <FilterBar
          cuisines={cuisines ?? []}
          activeCuisine={activeCuisine}
          search={search}
          sort={sort}
          view={view}
          locationAvailable={lat != null}
          onCuisineChange={handleCuisineChange}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onViewChange={setView}
        />

        <div>
          {restaurantsLoading ? (
            <SkeletonLoader variant="list" count={5} />
          ) : view === 'map' ? (
            <RestaurantMap
              restaurants={restaurantsData?.allRestaurants ?? []}
              center={lat != null && lng != null ? { lat, lng } : null}
              highlightedId={highlightedId}
              onMarkerHover={setHighlightedId}
            />
          ) : restaurantsData?.restaurants.length === 0 ? (
            <EmptyState
              title="No restaurants found"
              message="Try clearing the cuisine filter or check back later."
            />
          ) : (
            <>
              <div className="space-y-3">
                {restaurantsData?.restaurants.map((r) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    highlighted={highlightedId === r.id}
                    onMouseEnter={() => setHighlightedId(r.id)}
                    onMouseLeave={() => setHighlightedId(null)}
                  />
                ))}
              </div>

              {restaurantsData && restaurantsData.totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={restaurantsData.totalPages}
                  onPageChange={setPage}
                  className="mt-6"
                />
              )}
            </>
          )}
        </div>

        {/* Google Places auto-populated results */}
        {showPlacesSection && (
          <PlacesResults
            places={placesResults}
            isSearching={placesSearching}
            onImport={handleImport}
            importingId={importingId}
          />
        )}
      </div>
    </AppLayout>
  )
}
