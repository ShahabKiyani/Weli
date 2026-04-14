import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { haversineKm } from '@/lib/geo'
import { PAGINATION, QUERY_KEYS } from '@/lib/constants'
import type { RestaurantStats, RestaurantWithDistance } from '@/types/database.types'
import type { SortOption } from '@/components/FilterBar'

export interface RestaurantsResult {
  restaurants: RestaurantWithDistance[]
  allRestaurants: RestaurantWithDistance[]
  total: number
  totalPages: number
}

export interface UseRestaurantsOptions {
  cuisine?: string | null
  search?: string
  sort?: SortOption
  page?: number
  pageSize?: number
  lat?: number | null
  lng?: number | null
}

export function useRestaurants(options: UseRestaurantsOptions = {}) {
  const {
    cuisine,
    search = '',
    sort = 'name',
    page = 1,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
    lat,
    lng,
  } = options

  const transform = useCallback(
    (raw: RestaurantStats[]): RestaurantsResult => {
      const needle = search.trim().toLowerCase()

      const withDistance: RestaurantWithDistance[] = raw
        .filter((r) =>
          needle
            ? r.name.toLowerCase().includes(needle) ||
              (r.cuisine_type ?? '').toLowerCase().includes(needle) ||
              (r.address ?? '').toLowerCase().includes(needle)
            : true,
        )
        .map((r) => ({
          ...r,
          distanceKm:
            lat != null && lng != null
              ? haversineKm(lat, lng, r.latitude, r.longitude)
              : undefined,
        }))

      const sorted = [...withDistance].sort((a, b) => {
        if (sort === 'distance') {
          if (a.distanceKm == null) return 1
          if (b.distanceKm == null) return -1
          return a.distanceKm - b.distanceKm
        }
        if (sort === 'rating') return b.avg_score - a.avg_score
        return a.name.localeCompare(b.name)
      })

      const total = sorted.length
      const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0
      const from = (page - 1) * pageSize

      return {
        restaurants: sorted.slice(from, from + pageSize),
        allRestaurants: sorted,
        total,
        totalPages,
      }
    },
    [search, lat, lng, sort, page, pageSize],
  )

  return useQuery<RestaurantStats[], Error, RestaurantsResult>({
    queryKey: [QUERY_KEYS.RESTAURANTS, cuisine ?? null],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase.from('restaurant_stats').select('*')
      if (cuisine) q = q.eq('cuisine_type', cuisine)
      const { data, error } = (await q) as {
        data: RestaurantStats[] | null
        error: { message: string } | null
      }
      if (error) throw new Error(error.message)
      return data ?? []
    },
    select: transform,
  })
}
