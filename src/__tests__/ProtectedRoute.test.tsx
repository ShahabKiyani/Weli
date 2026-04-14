import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import type { AuthContextValue } from '@/contexts/AuthContext'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function makeAuth(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    state: { status: 'unauthenticated' },
    user: null,
    profile: null,
    session: null,
    loading: false,
    needsUsername: false,
    isAuthenticated: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    ...overrides,
  } as AuthContextValue
}

function renderWithRouter(auth: Partial<AuthContextValue>, initialPath = '/dashboard') {
  vi.mocked(useAuth).mockReturnValue(makeAuth(auth))
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/setup-username" element={<div>Setup Username Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          <Route path="/restaurants" element={<div>Discover Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.resetAllMocks())

describe('ProtectedRoute', () => {
  it('shows a loading indicator while auth is resolving', () => {
    renderWithRouter({ loading: true })
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
  })

  it('redirects to /login when user is not authenticated', () => {
    renderWithRouter({ loading: false, isAuthenticated: false, needsUsername: false })
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
  })

  it('redirects to /setup-username when user needs to set a username', () => {
    renderWithRouter({ loading: false, isAuthenticated: false, needsUsername: true })
    expect(screen.getByText('Setup Username Page')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
  })

  it('renders the protected child route when fully authenticated', () => {
    renderWithRouter({ loading: false, isAuthenticated: true, needsUsername: false })
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })

  it('does not redirect to login when needsUsername (user has a session)', () => {
    renderWithRouter({ loading: false, isAuthenticated: false, needsUsername: true })
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })
})
