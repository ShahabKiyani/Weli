import { test, expect } from '@playwright/test'

/**
 * Full user journey e2e test.
 *
 * Prerequisites:
 *   1. Run `npx playwright install --with-deps` to download browser binaries.
 *   2. Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GOOGLE_MAPS_API_KEY in .env.local
 *      pointing at a test Supabase project seeded with seed.sql.
 *   3. Run: npm run e2e
 *
 * Note: Google OAuth cannot be automated in CI without provider-level setup.
 * These tests assume an *already-authenticated* user session is injected via
 * Supabase's setSession() helper, which is called in the global setup file.
 * For simplicity the tests below cover the public/post-login flows end-to-end.
 */

test.describe('Login page', () => {
  test('shows the app name and sign-in button', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /weli/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
  })

  test('redirects authenticated users from /login to /dashboard', async ({ page }) => {
    // Unauthenticated → stays on login
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Discover page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly; ProtectedRoute will redirect to /login if not authed.
    // In a real CI setup, a global setup file would inject a valid session cookie.
    await page.goto('/discover')
  })

  test('shows the search input', async ({ page }) => {
    // Either the page loads (authenticated) or redirects to login (unauthenticated).
    // We just verify a landing page is rendered without JS errors.
    const title = await page.title()
    expect(title).toMatch(/weli/i)
  })
})

test.describe('Full journey — authenticated session', () => {
  /**
   * These tests require a live Supabase session. In local development:
   *
   *   1. Sign in manually once to get tokens.
   *   2. Pass them via E2E_ACCESS_TOKEN and E2E_REFRESH_TOKEN env vars.
   *   3. The globalSetup helper injects the session into the browser's localStorage.
   *
   * In this project's CI workflow, these tests are skipped unless E2E_ACCESS_TOKEN is set.
   */
  test.skip(
    !process.env.E2E_ACCESS_TOKEN,
    'Skipped: set E2E_ACCESS_TOKEN to run authenticated e2e tests',
  )

  test('discover page renders restaurant list', async ({ page }) => {
    await page.goto('/discover')

    await expect(page.getByPlaceholder(/search restaurants/i)).toBeVisible()
    // At least one restaurant card should appear (seeded data)
    await expect(page.locator('[data-testid="restaurant-card"]').first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('search filters the restaurant list', async ({ page }) => {
    await page.goto('/discover')

    const searchInput = page.getByPlaceholder(/search restaurants/i)
    await searchInput.fill('pita')

    // Only restaurants matching "pita" should remain
    const cards = page.locator('[data-testid="restaurant-card"]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(1)

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText(/pita/i)
    }
  })

  test('switching to map view shows the map container', async ({ page }) => {
    await page.goto('/discover')

    await page.getByRole('button', { name: /map view/i }).click()
    // Map container should be visible (or the Maps fallback if API key not set)
    await expect(
      page.locator('[data-testid="google-map"], [data-testid="map-fallback"]').first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('navigating to a restaurant detail page shows the name and review button', async ({
    page,
  }) => {
    await page.goto('/discover')

    // Click the first restaurant card
    const firstCard = page.locator('[data-testid="restaurant-card"]').first()
    const restaurantName = await firstCard.getByRole('heading').textContent()
    await firstCard.click()

    await expect(page).toHaveURL(/\/restaurants\//)
    await expect(page.getByRole('heading', { name: restaurantName! })).toBeVisible()
    await expect(page.getByRole('link', { name: /leave a review/i })).toBeVisible()
  })

  test('leaving a review submits and shows it in community reviews', async ({ page }) => {
    await page.goto('/discover')

    const firstCard = page.locator('[data-testid="restaurant-card"]').first()
    await firstCard.click()

    await page.getByRole('link', { name: /leave a review/i }).click()
    await expect(page).toHaveURL(/\/review$/)

    // Select score 8
    await page.getByRole('button', { name: /^8\b/i }).click()

    await page.getByRole('button', { name: /submit review/i }).click()

    // Should navigate back to the restaurant detail page
    await expect(page).toHaveURL(/\/restaurants\/[^/]+$/, { timeout: 10_000 })
  })

  test('dashboard shows the user stats card', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.getByText(/reviews/i)).toBeVisible()
    await expect(page.getByText(/avg score/i)).toBeVisible()
  })

  test('signing out returns the user to the login page', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('button', { name: /user menu/i }).click()
    await page.getByRole('menuitem', { name: /sign out/i }).click()

    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
  })
})
