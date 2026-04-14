import { describe, it, expect } from 'vitest'
import type {
  Profile,
  Restaurant,
  Review,
  RestaurantStats,
  ReviewInsert,
  ProfileUpdate,
  Friendship,
  FriendshipInsert,
  FriendshipUpdate,
  FriendFeedEntry,
  FriendshipWithProfiles,
} from '@/types/database.types'

describe('Database TypeScript types', () => {
  it('Profile has all required fields', () => {
    const profile: Profile = {
      id: 'uuid-1',
      username: 'testuser',
      avatar_url: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    expect(profile.id).toBeDefined()
    expect(profile.username).toBe('testuser')
    // username is nullable (null until set after OAuth)
    const nullableProfile: Profile = { ...profile, username: null }
    expect(nullableProfile.username).toBeNull()
  })

  it('Restaurant includes google_place_id and lat/lng as numbers', () => {
    const restaurant: Restaurant = {
      id: 'uuid-2',
      name: "Judie's Restaurant",
      address: '51 N Pleasant St, Amherst, MA 01002',
      latitude: 42.3751,
      longitude: -72.5197,
      cuisine_type: 'American',
      description: null,
      image_url: null,
      phone: null,
      website: null,
      google_place_id: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    expect(typeof restaurant.latitude).toBe('number')
    expect(typeof restaurant.longitude).toBe('number')
    // google_place_id is nullable
    expect(restaurant.google_place_id).toBeNull()
  })

  it('Review score is typed as number with required FKs', () => {
    const review: Review = {
      id: 'uuid-3',
      user_id: 'user-uuid',
      restaurant_id: 'restaurant-uuid',
      score: 8,
      comment: 'Great food and atmosphere!',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    expect(typeof review.score).toBe('number')
    // comment is nullable
    const noComment: Review = { ...review, comment: null }
    expect(noComment.comment).toBeNull()
  })

  it('RestaurantStats extends Restaurant with avg_score and review_count', () => {
    const stats: RestaurantStats = {
      id: 'uuid-4',
      name: "Judie's Restaurant",
      address: '51 N Pleasant St, Amherst, MA 01002',
      latitude: 42.3751,
      longitude: -72.5197,
      cuisine_type: 'American',
      description: 'A beloved Amherst staple.',
      image_url: null,
      phone: '(413) 253-3491',
      website: 'https://judiesrestaurant.com',
      google_place_id: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      avg_score: 8.4,
      review_count: 23,
    }
    expect(typeof stats.avg_score).toBe('number')
    expect(typeof stats.review_count).toBe('number')
  })

  it('ReviewInsert omits id, created_at, updated_at (all optional)', () => {
    const insert: ReviewInsert = {
      user_id: 'user-uuid',
      restaurant_id: 'restaurant-uuid',
      score: 9,
      comment: 'Outstanding!',
    }
    expect(insert.score).toBe(9)
  })

  it('ProfileUpdate allows partial updates', () => {
    const update: ProfileUpdate = { username: 'newusername' }
    expect(update.username).toBe('newusername')
  })
})

describe('Friendship TypeScript types', () => {
  const baseFriendship: Friendship = {
    id: 'f-uuid-1',
    requester_id: 'user-a',
    addressee_id: 'user-b',
    status: 'pending',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  it('Friendship Row has all required fields', () => {
    expect(baseFriendship.id).toBeDefined()
    expect(baseFriendship.requester_id).toBe('user-a')
    expect(baseFriendship.addressee_id).toBe('user-b')
    expect(baseFriendship.status).toBe('pending')
    expect(baseFriendship.created_at).toBeDefined()
    expect(baseFriendship.updated_at).toBeDefined()
  })

  it('Friendship status accepts all three valid values', () => {
    const pending: Friendship = { ...baseFriendship, status: 'pending' }
    const accepted: Friendship = { ...baseFriendship, status: 'accepted' }
    const declined: Friendship = { ...baseFriendship, status: 'declined' }
    expect(pending.status).toBe('pending')
    expect(accepted.status).toBe('accepted')
    expect(declined.status).toBe('declined')
  })

  it('FriendshipInsert requires requester_id and addressee_id', () => {
    const insert: FriendshipInsert = {
      requester_id: 'user-a',
      addressee_id: 'user-b',
    }
    expect(insert.requester_id).toBe('user-a')
    expect(insert.addressee_id).toBe('user-b')
    // id and timestamps are optional
    expect(insert.id).toBeUndefined()
    expect(insert.created_at).toBeUndefined()
  })

  it('FriendshipInsert allows optional status (defaults to pending in DB)', () => {
    const insert: FriendshipInsert = {
      requester_id: 'user-a',
      addressee_id: 'user-b',
      status: 'pending',
    }
    expect(insert.status).toBe('pending')
  })

  it('FriendshipUpdate only allows status and updated_at changes', () => {
    const update: FriendshipUpdate = { status: 'accepted' }
    expect(update.status).toBe('accepted')
    const declineUpdate: FriendshipUpdate = { status: 'declined' }
    expect(declineUpdate.status).toBe('declined')
  })

  it('FriendFeedEntry has all required feed columns', () => {
    const entry: FriendFeedEntry = {
      review_id: 'rv-uuid-1',
      user_id: 'user-a',
      restaurant_id: 'rest-uuid-1',
      score: 8,
      comment: 'Really good noodles!',
      created_at: '2026-01-01T00:00:00Z',
      username: 'foodie',
      avatar_url: 'https://example.com/avatar.jpg',
      restaurant_name: 'Pho Ha Noi',
      cuisine_type: 'Vietnamese',
      restaurant_image_url: null,
    }
    expect(entry.review_id).toBeDefined()
    expect(entry.score).toBe(8)
    expect(entry.username).toBe('foodie')
    expect(entry.restaurant_name).toBe('Pho Ha Noi')
    expect(entry.restaurant_image_url).toBeNull()
  })

  it('FriendFeedEntry comment is nullable', () => {
    const entry: FriendFeedEntry = {
      review_id: 'rv-uuid-2',
      user_id: 'user-b',
      restaurant_id: 'rest-uuid-2',
      score: 6,
      comment: null,
      created_at: '2026-01-01T00:00:00Z',
      username: 'critic',
      avatar_url: null,
      restaurant_name: 'The Pub',
      cuisine_type: 'American',
      restaurant_image_url: null,
    }
    expect(entry.comment).toBeNull()
    expect(entry.avatar_url).toBeNull()
  })

  it('FriendshipWithProfiles embeds requester and addressee Profile objects', () => {
    const profileA: Profile = {
      id: 'user-a',
      username: 'alice',
      avatar_url: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    const profileB: Profile = {
      id: 'user-b',
      username: 'bob',
      avatar_url: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    const withProfiles: FriendshipWithProfiles = {
      ...baseFriendship,
      requester: profileA,
      addressee: profileB,
    }
    expect(withProfiles.requester.username).toBe('alice')
    expect(withProfiles.addressee.username).toBe('bob')
  })
})
