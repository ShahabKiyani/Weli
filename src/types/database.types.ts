export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number
          longitude: number
          cuisine_type: string
          description: string | null
          image_url: string | null
          phone: string | null
          website: string | null
          google_place_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          latitude: number
          longitude: number
          cuisine_type: string
          description?: string | null
          image_url?: string | null
          phone?: string | null
          website?: string | null
          google_place_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          address?: string
          latitude?: number
          longitude?: number
          cuisine_type?: string
          description?: string | null
          image_url?: string | null
          phone?: string | null
          website?: string | null
          google_place_id?: string | null
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          score: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          score: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          score?: number
          comment?: string | null
          updated_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          addressee_id: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'declined'
          updated_at?: string
        }
      }
    }
    Views: {
      restaurant_stats: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number
          longitude: number
          cuisine_type: string
          description: string | null
          image_url: string | null
          phone: string | null
          website: string | null
          google_place_id: string | null
          created_at: string
          updated_at: string
          avg_score: number
          review_count: number
        }
      }
      friend_feed: {
        Row: {
          review_id: string
          user_id: string
          restaurant_id: string
          score: number
          comment: string | null
          created_at: string
          username: string | null
          avatar_url: string | null
          restaurant_name: string
          cuisine_type: string
          restaurant_image_url: string | null
        }
      }
    }
    Functions: Record<string, never>
  }
}

// ── Convenience row aliases ──────────────────────────────────────────────────

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']
export type RestaurantStats = Database['public']['Views']['restaurant_stats']['Row']
export type FriendFeedEntry = Database['public']['Views']['friend_feed']['Row']

// ── Insert / Update aliases ──────────────────────────────────────────────────

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert']
export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update']

export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

export type FriendshipInsert = Database['public']['Tables']['friendships']['Insert']
export type FriendshipUpdate = Database['public']['Tables']['friendships']['Update']

// ── Join types ───────────────────────────────────────────────────────────────

export type RestaurantWithDistance = RestaurantStats & { distanceKm?: number }

export type ReviewWithProfile = Review & {
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
}

export type ReviewWithRestaurant = Review & {
  restaurants: {
    id: string
    name: string
    cuisine_type: string
  } | null
}

/** A friendship row with both parties' profile data embedded. */
export type FriendshipWithProfiles = Friendship & {
  requester: Profile
  addressee: Profile
}

/** The friendship relationship status between the current user and another user. */
export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'
