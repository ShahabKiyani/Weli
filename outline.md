# Project Outline: Weli — Local Restaurant Ranking App

## 1. Project Overview

A React-based web application designed for the Amherst community to discover, rank, and review local restaurants. The platform allows users to share their dining experiences using a 1-10 scoring system and text reviews, while providing an aggregated view of average restaurant ratings based on community input.

## 2. Tech Stack

### Frontend

- **Framework:** React 18 + TypeScript (using Vite)
- **Routing:** React Router v6
- **State Management:** React Context (auth/geolocation) + TanStack Query (server state)
- **Styling:** Tailwind CSS 4
- **Maps:** Google Maps JavaScript API via `@vis.gl/react-google-maps` (interactive discovery map, restaurant detail map)
- **Geolocation:** HTML5 Geolocation API (for proximity sorting and map centering)
- **Icons:** Lucide React

### Backend (Supabase BaaS)

- **Auth:** Supabase Auth with Google OAuth (primary) + email/password (secondary)
- **Database:** Supabase-hosted PostgreSQL
- **API:** Supabase client SDK (`@supabase/supabase-js`) — auto-generated PostgREST endpoints
- **Authorization:** Row Level Security (RLS) policies on all tables
- **Realtime:** Not used in v1 (available for future)

## 3. Core Pages and Component Architecture

### 3.1. Authentication Pages (Login / Sign Up)

- **Purpose:** Handle user onboarding and session management via Supabase Auth.
- **Components:**
  - `AuthLayout`: Wrapper for background styling.
  - `LoginPage`: "Sign in with Google" button (primary) + email/password form (secondary).
  - `SignUpPage`: "Sign up with Google" button (primary) + username/email/password form (secondary).
  - `AuthCallbackPage`: Handles OAuth redirect from Google, exchanges code for session.
- **State/Logic:** Supabase session management; `onAuthStateChange` listener; auto-creation of `profiles` row on first sign-in via database trigger.

### 3.2. User Homepage (Dashboard)

- **Purpose:** The landing area after login, showcasing the user's personal review history.
- **Components:**
  - `NavBar`: Links to Dashboard, Find Restaurants, Profile, and Logout.
  - `UserStatsCard`: Brief summary (e.g., "You have reviewed 12 restaurants").
  - `ReviewFeed`: A scrollable list of the user's past reviews.
  - `ReviewItem`: A card displaying the restaurant name, the 1-10 score given, the text comment, and the date.
- **State/Logic:** Fetching user-specific reviews from Supabase via the client SDK upon component mount.

### 3.3. Find Restaurant Page (Discovery)

- **Purpose:** Display all restaurants in the Amherst region, with both list and map views, ordered by physical proximity to the user.
- **Components:**
  - `LocationPrompt`: UI to request permission to use the user's current location.
  - `FilterBar`: Optional toggles (e.g., sort by highest rated vs. closest distance, cuisine type).
  - `ViewToggle`: Toggle between list view and map view.
  - `RestaurantList`: The main container for the restaurant data (list view).
  - `RestaurantCard`: Displays restaurant name, average community score, cuisine type, and calculated distance (e.g., "1.2 miles away"). Clicking this navigates to the Restaurant Details page.
  - `RestaurantMap`: Interactive Google Map centered on Amherst with markers for each restaurant. Markers show score badge; clicking a marker opens an info window with restaurant name, score, and a link to the detail page.
- **State/Logic:**
  - Capture user's latitude/longitude.
  - Center Google Map on user location (or Amherst center as fallback).
  - Calculate the distance (using the Haversine formula) between the user and each restaurant's coordinates.
  - Sort the array of restaurant objects by this calculated distance.
  - Highlight selected restaurant marker when hovering a list card (and vice versa).

### 3.4. Restaurant Details Page

- **Purpose:** Provide comprehensive information about a specific restaurant and showcase community feedback.
- **Components:**
  - `RestaurantHeader`: Name, address, aggregate average score (e.g., "Average: 8.4/10"), and total number of reviews.
  - `RestaurantLocationMap`: Embedded Google Map showing the restaurant's pin with a "Get Directions" link (opens Google Maps in new tab).
  - `ActionRow`: A prominent "Leave a Review" button that navigates to the Ranking Page.
  - `CommunityReviewsList`: A list of all reviews left by other users.
  - `PublicReviewCard`: Displays the reviewer's username, their 1-10 score, and their text comment.
- **State/Logic:** Fetch specific restaurant data and its associated reviews using the restaurant's unique ID from the URL parameters.

### 3.5. Ranking / Review Page

- **Purpose:** The form where users submit their 1-10 score and written feedback for a specific restaurant.
- **Components:**
  - `ReviewHeader`: "How was your experience at [Restaurant Name]?"
  - `ScoreSelector`: An interactive 1-10 button group to select the numerical ranking.
  - `CommentBox`: A text area for the written review.
  - `SubmitButton`: Triggers the insert/upsert to Supabase.
- **State/Logic:** Validate that a score is selected before allowing submission. Upon successful submission, redirect the user back to the Restaurant Details page.

## 4. Data Models (Supabase PostgreSQL)

### Managed by Supabase Auth

- **`auth.users`** — managed by Supabase. Contains id, email, OAuth metadata. Not directly queried by app code.

### Public Schema (app-managed)

- **`profiles`**: `id` (UUID, FK → auth.users.id), `username`, `avatar_url`, `created_at`, `updated_at`. Auto-created via database trigger on new auth.users row.
- **`restaurants`**: `id` (UUID), `name`, `address`, `latitude`, `longitude`, `cuisine_type`, `description`, `image_url`, `phone`, `website`, `google_place_id` (for Google Maps deep-linking), `created_at`, `updated_at`.
- **`reviews`**: `id` (UUID), `user_id` (FK → profiles.id), `restaurant_id` (FK → restaurants.id), `score` (Integer 1-10), `comment` (Text), `created_at`, `updated_at`. Unique constraint on `(user_id, restaurant_id)`.

### Database Views

- **`restaurant_stats`**: View joining restaurants with aggregated avg_score and review_count from reviews.

### Row Level Security

- All tables have RLS enabled.
- `profiles`: users can read all profiles; users can update only their own.
- `restaurants`: anyone authenticated can read; inserts/updates restricted (admin or seed only).
- `reviews`: anyone authenticated can read; users can insert/update/delete only their own.
