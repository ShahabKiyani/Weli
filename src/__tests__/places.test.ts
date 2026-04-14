import { describe, it, expect } from 'vitest'
import { mapGoogleTypeToCuisine, mapPlaceToRestaurant, CUISINE_TYPE_MAP } from '@/lib/places'

describe('CUISINE_TYPE_MAP', () => {
  it('is a non-empty object', () => {
    expect(Object.keys(CUISINE_TYPE_MAP).length).toBeGreaterThan(0)
  })
})

describe('mapGoogleTypeToCuisine', () => {
  it('returns a specific cuisine for known types', () => {
    expect(mapGoogleTypeToCuisine(['chinese_restaurant'])).toBe('Chinese')
    expect(mapGoogleTypeToCuisine(['italian_restaurant'])).toBe('Italian')
    expect(mapGoogleTypeToCuisine(['japanese_restaurant'])).toBe('Japanese')
    expect(mapGoogleTypeToCuisine(['mexican_restaurant'])).toBe('Mexican')
    expect(mapGoogleTypeToCuisine(['indian_restaurant'])).toBe('Indian')
    expect(mapGoogleTypeToCuisine(['thai_restaurant'])).toBe('Thai')
  })

  it('returns the first matching type when multiple known types are present', () => {
    const result = mapGoogleTypeToCuisine(['restaurant', 'chinese_restaurant', 'food'])
    expect(result).toBe('Chinese')
  })

  it('returns "Restaurant" for generic types like ["restaurant", "food", "establishment"]', () => {
    expect(mapGoogleTypeToCuisine(['restaurant', 'food', 'establishment'])).toBe('Restaurant')
  })

  it('returns "Restaurant" for an empty types array', () => {
    expect(mapGoogleTypeToCuisine([])).toBe('Restaurant')
  })

  it('returns "Cafe" for cafe type', () => {
    expect(mapGoogleTypeToCuisine(['cafe'])).toBe('Cafe')
  })

  it('returns "Bar" for bar type', () => {
    expect(mapGoogleTypeToCuisine(['bar'])).toBe('Bar')
  })

  it('returns "Bakery" for bakery type', () => {
    expect(mapGoogleTypeToCuisine(['bakery'])).toBe('Bakery')
  })
})

describe('mapPlaceToRestaurant', () => {
  const mockPlace = {
    place_id: 'ChIJ_test123',
    name: 'Test Restaurant',
    formatted_address: '100 Main St, Amherst, MA 01002',
    geometry: {
      location: {
        lat: () => 42.3750,
        lng: () => -72.5200,
      },
    },
    types: ['chinese_restaurant', 'restaurant', 'food', 'establishment'],
    photos: [
      {
        getUrl: ({ maxWidth }: { maxWidth: number }) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=abc`,
      },
    ],
  }

  it('maps name correctly', () => {
    const result = mapPlaceToRestaurant(mockPlace)
    expect(result.name).toBe('Test Restaurant')
  })

  it('maps address from formatted_address', () => {
    const result = mapPlaceToRestaurant(mockPlace)
    expect(result.address).toBe('100 Main St, Amherst, MA 01002')
  })

  it('maps latitude and longitude from geometry.location', () => {
    const result = mapPlaceToRestaurant(mockPlace)
    expect(result.latitude).toBe(42.3750)
    expect(result.longitude).toBe(-72.5200)
  })

  it('maps google_place_id from place_id', () => {
    const result = mapPlaceToRestaurant(mockPlace)
    expect(result.google_place_id).toBe('ChIJ_test123')
  })

  it('maps cuisine_type from Google types', () => {
    const result = mapPlaceToRestaurant(mockPlace)
    expect(result.cuisine_type).toBe('Chinese')
  })

  it('extracts image_url from the first photo', () => {
    const result = mapPlaceToRestaurant(mockPlace)
    expect(result.image_url).toContain('maxwidth=')
  })

  it('handles missing photos gracefully', () => {
    const placeNoPhotos = { ...mockPlace, photos: undefined }
    const result = mapPlaceToRestaurant(placeNoPhotos)
    expect(result.image_url).toBeNull()
  })

  it('handles missing geometry gracefully', () => {
    const placeNoGeo = { ...mockPlace, geometry: undefined }
    const result = mapPlaceToRestaurant(placeNoGeo)
    expect(result.latitude).toBe(0)
    expect(result.longitude).toBe(0)
  })

  it('handles missing formatted_address gracefully', () => {
    const placeNoAddr = { ...mockPlace, formatted_address: undefined }
    const result = mapPlaceToRestaurant(placeNoAddr)
    expect(result.address).toBe('')
  })

  it('returns an object with all required RestaurantInsert fields', () => {
    const result = mapPlaceToRestaurant(mockPlace)
    expect(result).toHaveProperty('name')
    expect(result).toHaveProperty('address')
    expect(result).toHaveProperty('latitude')
    expect(result).toHaveProperty('longitude')
    expect(result).toHaveProperty('cuisine_type')
    expect(result).toHaveProperty('google_place_id')
    expect(result).toHaveProperty('image_url')
  })
})
