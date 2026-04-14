import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/contexts/AuthContext'
import { useFriendRequests } from '@/hooks/useFriendRequests'
import type { AuthContextValue } from '@/contexts/AuthContext'

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('@/hooks/useFriendRequests')

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    state: { status: 'authenticated' } as AuthContextValue['state'],
    user: { id: 'u1', email: 'test@example.com', user_metadata: {} } as never,
    profile: { id: 'u1', username: 'testuser', avatar_url: null } as never,
    session: null,
    loading: false,
    needsUsername: false,
    isAuthenticated: true,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    ...overrides,
  }
}

let testQueryClient: QueryClient

function renderNavBar(auth = makeAuth()) {
  vi.mocked(useAuth).mockReturnValue(auth)
  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<NavBar />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.mocked(useFriendRequests).mockReturnValue({ data: [], isLoading: false } as never)
})

describe('NavBar', () => {
  it('renders the app name', () => {
    renderNavBar()
    expect(screen.getByText('Weli')).toBeInTheDocument()
  })

  it('renders Dashboard and Discover navigation links', () => {
    renderNavBar()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Discover' })).toBeInTheDocument()
  })

  it('shows a user avatar button', () => {
    renderNavBar()
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument()
  })

  it('shows avatar initial when no avatar_url is set', () => {
    renderNavBar()
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('shows an img when user has avatar_url', () => {
    const auth = makeAuth({
      user: { id: 'u1', email: 'a@b.com', user_metadata: {} } as never,
      profile: {
        id: 'u1',
        username: 'alice',
        avatar_url: 'https://example.com/avatar.jpg',
      } as never,
    })
    renderNavBar(auth)
    const img = screen.getByRole('img', { name: 'alice' })
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('opens the dropdown when avatar button is clicked', async () => {
    renderNavBar()
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('calls signOut when the sign-out menu item is clicked', async () => {
    const signOut = vi.fn()
    renderNavBar(makeAuth({ signOut }))
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }))
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('clears the TanStack Query cache when sign-out is clicked', async () => {
    const clearSpy = vi.spyOn(testQueryClient, 'clear')
    renderNavBar()
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }))
    expect(clearSpy).toHaveBeenCalledOnce()
  })

  it('navigates to /login after sign-out', async () => {
    renderNavBar()
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }))
    await waitFor(() => expect(screen.getByText('Login Page')).toBeInTheDocument())
  })

  it('toggles the mobile menu with the hamburger button', async () => {
    renderNavBar()
    const hamburger = screen.getByRole('button', { name: /open menu/i })
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument()
    await userEvent.click(hamburger)
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument()
  })

  it('closes the dropdown when clicking outside', async () => {
    renderNavBar()
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.click(document.body)
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('renders a Feed navigation link', () => {
    renderNavBar()
    expect(screen.getByRole('link', { name: 'Feed' })).toBeInTheDocument()
  })

  it('shows "My Profile" in the avatar dropdown menu', async () => {
    renderNavBar()
    await userEvent.click(screen.getByRole('button', { name: /user menu/i }))
    expect(screen.getByRole('menuitem', { name: /my profile/i })).toBeInTheDocument()
  })

  it('does not show a pending-requests badge when there are no requests', () => {
    vi.mocked(useFriendRequests).mockReturnValue({ data: [], isLoading: false } as never)
    renderNavBar()
    expect(screen.queryByTestId('friend-request-badge')).not.toBeInTheDocument()
  })

  it('shows a pending-requests badge when there are incoming friend requests', () => {
    const pending = [{
      id: 'f-req-1', requester_id: 'user-x', addressee_id: 'u1', status: 'pending',
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      requester: { id: 'user-x', username: 'xavier', avatar_url: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    }]
    vi.mocked(useFriendRequests).mockReturnValue({ data: pending as never, isLoading: false } as never)
    renderNavBar()
    expect(screen.getByTestId('friend-request-badge')).toBeInTheDocument()
  })

  it('shows "My Profile" in the mobile menu when hamburger is open', async () => {
    renderNavBar()
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const mobileNav = screen.getByRole('navigation', { name: 'Mobile' })
    expect(mobileNav).toContainElement(screen.getByText('My Profile'))
  })
})
