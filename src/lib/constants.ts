export const APP_NAME = 'Weli' as const

export const AMHERST_CENTER = {
  lat: 42.3732,
  lng: -72.5199,
} as const

export const MAP_DEFAULTS = {
  center: AMHERST_CENTER,
  zoom: 14,
} as const

export const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_JAVASCRIPT_MAPS_API_KEY ??
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY) as string

export const ROUTES = {
  LOGIN: '/login',
  AUTH_CALLBACK: '/auth/callback',
  SETUP_USERNAME: '/setup-username',
  DASHBOARD: '/dashboard',
  DISCOVER: '/restaurants',
  FEED: '/feed',
  PROFILE: '/profile',
  PUBLIC_PROFILE: (id: string) => `/profile/${id}`,
  RESTAURANT_DETAIL: (id: string) => `/restaurants/${id}`,
  REVIEW_FORM: (id: string) => `/restaurants/${id}/review`,
} as const

export const QUERY_KEYS = {
  RESTAURANTS: 'restaurants',
  RESTAURANT: (id: string) => ['restaurant', id],
  RESTAURANT_REVIEWS: (id: string) => ['restaurant-reviews', id],
  USER_REVIEW: (restaurantId: string) => ['user-review', restaurantId],
  MY_REVIEWS: 'my-reviews',
  MY_STATS: 'my-stats',
  CUISINES: 'cuisines',
  PROFILE: (id: string) => ['profile', id],
  FRIENDS: (userId: string) => ['friends', userId],
  FRIEND_REQUESTS: (userId: string) => ['friend-requests', userId],
  SEARCH_USERS: (userId: string, query: string) => ['search-users', userId, query],
  SUGGESTED_FRIENDS: (userId: string) => ['suggested-friends', userId],
  FRIEND_FEED: (userId: string) => ['friend-feed', userId],
  PUBLIC_PROFILE: (id: string) => ['public-profile', id],
} as const

export const REVIEW_SCORE_LABELS: Record<number, string> = {
  1: 'Awful',
  2: 'Bad',
  3: 'Poor',
  4: 'Below Average',
  5: 'Average',
  6: 'Decent',
  7: 'Good',
  8: 'Great',
  9: 'Excellent',
  10: 'Outstanding',
}

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
} as const
