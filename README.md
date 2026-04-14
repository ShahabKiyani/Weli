# Weli

Weli is a community-driven restaurant ranking app for Amherst, MA. Users sign in with Google, score restaurants 1–10, and discover the best spots on an interactive map or ranked list.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS 4 |
| Routing | React Router v6 |
| Data fetching | TanStack Query v5 |
| Backend / Auth | [Supabase](https://supabase.com) (PostgreSQL + Auth + PostgREST) |
| Maps | [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) via `@vis.gl/react-google-maps` |
| Testing | Vitest · Testing Library · Playwright |
| Deployment | Vercel or Netlify |

---

## Quick Start (Local Development)

### 1. Prerequisites

- Node.js 20+
- A Supabase project (free tier works)
- A Google Cloud project with the **Maps JavaScript API** and **OAuth 2.0** credentials enabled

### 2. Clone and install

```bash
git clone <your-repo-url>
cd weli
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_GOOGLE_MAPS_API_KEY=<your-maps-api-key>
```

> **Never commit `.env.local`** — it is already listed in `.gitignore`.

### 4. Set up the Supabase database

Open the **SQL Editor** in your Supabase dashboard and run each file in order:

```
supabase/migrations/001_create_profiles.sql
supabase/migrations/002_create_restaurants.sql
supabase/migrations/003_create_reviews.sql
supabase/migrations/004_restaurant_stats_view.sql
supabase/migrations/005_handle_new_user_trigger.sql
supabase/migrations/006_rls_policies.sql
supabase/seed.sql
```

See [supabase/README.md](./supabase/README.md) for details and migration order rationale.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Environment Variable Reference

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL, e.g. `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase `anon` public key (safe to expose in the browser) |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |

---

## Supabase Setup Guide

### Create a project

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project.
2. Copy the **Project URL** and **anon public key** from *Settings → API* into `.env.local`.

### Enable Google OAuth

1. In the Supabase dashboard go to **Authentication → Providers → Google**.
2. Toggle Google on and paste your OAuth Client ID and Client Secret.
3. Copy the **Callback URL** shown by Supabase (looks like `https://<ref>.supabase.co/auth/v1/callback`).

**In Google Cloud Console:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → *APIs & Services → Credentials*.
2. Create (or edit) an **OAuth 2.0 Client ID** for a *Web application*.
3. Add `http://localhost:5173` to **Authorized JavaScript origins**.
4. Add the Supabase callback URL to **Authorized redirect URIs**.

### Row Level Security

All tables have RLS enabled by `006_rls_policies.sql`. The policies enforce:

- **profiles**: users can only read/update their own profile.
- **restaurants**: readable by all authenticated users; write-protected.
- **reviews**: users can create/update/delete their own reviews; all authenticated users can read.

---

## Google Maps API Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → *APIs & Services → Library*.
2. Enable the **Maps JavaScript API**.
3. Under *APIs & Services → Credentials*, create or select an **API Key**.
4. Restrict the key to **Maps JavaScript API** and add your deployment domain (and `localhost`) to HTTP referrers.
5. If the map shows an error dialog ("This page can't load Google Maps correctly"), double-check that:
   - Billing is enabled on your Google Cloud project.
   - The Maps JavaScript API is enabled (not just Directions or Places).
   - The key's referrer restrictions allow your domain.

---

## Available Scripts

```bash
npm run dev           # Start Vite dev server on :5173
npm run build         # TypeScript check + production build → dist/
npm run preview       # Serve the dist/ folder locally
npm run lint          # ESLint check
npm run format        # Prettier auto-format
npm run format:check  # Prettier format check (CI)
npm run test          # Vitest watch mode
npm run test:run      # Vitest single run
npm run test:coverage # Vitest with V8 coverage report
npm run e2e           # Playwright e2e tests (requires running server)
npm run e2e:ui        # Playwright interactive UI
npm run e2e:report    # Open last Playwright HTML report
```

---

## Running Tests

### Unit & integration tests (Vitest)

```bash
npm run test:run
```

Runs all 422+ tests in jsdom with mocked Supabase and Maps APIs. No network required.

### Coverage

```bash
npm run test:coverage
```

HTML report is written to `coverage/index.html`. The project targets ≥ 70 % line coverage.

### End-to-end tests (Playwright)

Playwright tests live in `e2e/`. They require a running dev server and a live Supabase instance.

```bash
# 1. Install browser binaries (one-time)
npx playwright install --with-deps

# 2. Run e2e tests
npm run e2e
```

Authenticated tests require `E2E_ACCESS_TOKEN` and `E2E_REFRESH_TOKEN` env vars. Without them, the authenticated suite is automatically skipped.

---

## Deployment

### Vercel (recommended)

1. Push your repository to GitHub/GitLab.
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Set the following **Environment Variables** in the Vercel project settings:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `VITE_GOOGLE_MAPS_API_KEY` | your Maps API key |

4. Vercel auto-detects Vite; the build command is `npm run build` and output directory is `dist`.
5. The `vercel.json` in this repo configures the **SPA rewrite rule** (`/* → /index.html`) so that React Router deep links work.

### Netlify

1. Connect the repo in the [Netlify dashboard](https://app.netlify.com).
2. Set the same three environment variables in *Site settings → Environment variables*.
3. The `netlify.toml` in this repo sets `command = "npm run build"`, `publish = "dist"`, and the SPA redirect rule automatically.

### After first deployment

Add your production URL to:
- Google OAuth Client ID → **Authorized JavaScript origins**
- Google Maps API Key → **HTTP referrer restrictions**
- Supabase Authentication → **Site URL** and **Redirect URLs** (`https://your-domain.com/auth/callback`)

---

## Project Structure

```
weli/
├── e2e/                        # Playwright end-to-end tests
├── public/                     # Static assets (favicon.svg)
├── src/
│   ├── __tests__/              # Vitest unit & integration tests
│   ├── components/             # Reusable UI components
│   ├── contexts/               # React contexts (AuthContext)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions & constants
│   ├── pages/                  # Route-level page components
│   └── types/                  # TypeScript type definitions
├── supabase/
│   ├── migrations/             # SQL migration files (run in order)
│   └── seed.sql                # 22 Amherst restaurant seed rows
├── netlify.toml                # Netlify build & redirect config
├── playwright.config.ts        # Playwright e2e config
├── vercel.json                 # Vercel rewrite & header config
└── vite.config.ts              # Vite + Vitest config
```

---

## Seed Data

`supabase/seed.sql` contains 22 real Amherst, MA restaurants with accurate addresses, coordinates, and cuisine types. All rows have `avg_score = 0` and `review_count = 0` until users submit reviews.

To populate `google_place_id` values (used for precise "Get Directions" links):

```sql
UPDATE restaurants
SET google_place_id = 'ChIJ...'
WHERE name = 'Amherst Brewing Company';
```

Use the [Places API Place Search](https://developers.google.com/maps/documentation/places/web-service/search) to look up each ID.

---

## Contributing

1. Branch from `main`.
2. Run `npm run lint` and `npm run test:run` before opening a PR.
3. All new features should ship with tests.
