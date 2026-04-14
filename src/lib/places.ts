import type { RestaurantInsert } from '@/types/database.types'

/**
 * Intermediate type for a Google Places result ready for display and import.
 * Decoupled from the Google Maps SDK types so UI components don't depend on them.
 */
export interface PlaceCandidate {
  place_id: string
  name: string
  address: string
  latitude: number
  longitude: number
  cuisine_type: string
  image_url: string | null
}

// ── Cuisine type mapping ────────────────────────────────────────────────────

export const CUISINE_TYPE_MAP: Record<string, string> = {
  chinese_restaurant: 'Chinese',
  indian_restaurant: 'Indian',
  italian_restaurant: 'Italian',
  japanese_restaurant: 'Japanese',
  korean_restaurant: 'Korean',
  mexican_restaurant: 'Mexican',
  thai_restaurant: 'Thai',
  vietnamese_restaurant: 'Vietnamese',
  mediterranean_restaurant: 'Mediterranean',
  middle_eastern_restaurant: 'Middle Eastern',
  french_restaurant: 'French',
  greek_restaurant: 'Greek',
  spanish_restaurant: 'Spanish',
  american_restaurant: 'American',
  hamburger_restaurant: 'American',
  steak_house: 'American',
  seafood_restaurant: 'Seafood',
  sushi_restaurant: 'Japanese',
  ramen_restaurant: 'Japanese',
  pizza_restaurant: 'Pizza',
  sandwich_shop: 'Deli',
  ice_cream_shop: 'Ice Cream',
  bakery: 'Bakery',
  cafe: 'Cafe',
  coffee_shop: 'Cafe',
  bar: 'Bar',
  meal_delivery: 'Restaurant',
  meal_takeaway: 'Restaurant',
  fast_food_restaurant: 'Fast Food',
  breakfast_restaurant: 'Breakfast',
  brunch_restaurant: 'Breakfast',
  vegan_restaurant: 'Vegan',
  vegetarian_restaurant: 'Vegetarian',
}

const GENERIC_TYPES = new Set(['restaurant', 'food', 'establishment', 'point_of_interest'])

/**
 * Given Google place `types` array, return the best matching cuisine label.
 * Prioritises specific types over generic ones.
 */
export function mapGoogleTypeToCuisine(types: string[]): string {
  for (const t of types) {
    if (CUISINE_TYPE_MAP[t]) return CUISINE_TYPE_MAP[t]
  }
  // All types were generic (or empty)
  if (types.some((t) => GENERIC_TYPES.has(t))) return 'Restaurant'
  return 'Restaurant'
}

// ── Place-to-restaurant mapper ──────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
const PHOTO_MAX_WIDTH = 480

/**
 * Converts a raw Google `PlaceResult` (from `PlacesService.textSearch`) into
 * a `RestaurantInsert` suitable for upserting into Supabase.
 */
export function mapPlaceToRestaurant(place: any): RestaurantInsert {
  const lat = place.geometry?.location?.lat?.() ?? place.geometry?.location?.lat ?? 0
  const lng = place.geometry?.location?.lng?.() ?? place.geometry?.location?.lng ?? 0

  let imageUrl: string | null = null
  if (place.photos?.length) {
    const photo = place.photos[0]
    imageUrl = typeof photo.getUrl === 'function' ? photo.getUrl({ maxWidth: PHOTO_MAX_WIDTH }) : null
  }

  return {
    name: place.name ?? '',
    address: place.formatted_address ?? '',
    latitude: lat,
    longitude: lng,
    cuisine_type: mapGoogleTypeToCuisine(place.types ?? []),
    google_place_id: place.place_id ?? null,
    image_url: imageUrl,
  }
}

/**
 * Converts a raw `PlaceResult` to our UI-friendly `PlaceCandidate` shape.
 */
export function placeResultToCandidate(place: any): PlaceCandidate {
  const r = mapPlaceToRestaurant(place)
  return {
    place_id: r.google_place_id ?? '',
    name: r.name,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    cuisine_type: r.cuisine_type,
    image_url: r.image_url ?? null,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
