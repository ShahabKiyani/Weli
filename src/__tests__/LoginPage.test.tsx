import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import { useAuth } from '@/contexts/AuthContext'
import type { AuthContextValue } from '@/contexts/AuthContext'

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    state: { status: 'unauthenticated' } as AuthContextValue['state'],
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
  }
}

function renderLoginPage(auth = makeAuth()) {
  vi.mocked(useAuth).mockReturnValue(auth)
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.resetAllMocks())

describe('LoginPage', () => {
  it('renders the app name', () => {
    renderLoginPage()
    expect(screen.getByRole('heading', { name: 'Weli' })).toBeInTheDocument()
  })

  it('renders the Sign in with Google button', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('calls signInWithGoogle when the button is clicked', async () => {
    const signInWithGoogle = vi.fn()
    renderLoginPage(makeAuth({ signInWithGoogle }))
    await userEvent.click(screen.getByRole('button', { name: /sign in with google/i }))
    expect(signInWithGoogle).toHaveBeenCalledOnce()
  })

  it('disables the button when auth is loading', () => {
    renderLoginPage(makeAuth({ loading: true }))
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeDisabled()
  })

  it('redirects to /dashboard when the user is already authenticated', async () => {
    renderLoginPage(makeAuth({ isAuthenticated: true, loading: false }))
    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
  })

  it('does NOT redirect while auth state is still loading', () => {
    renderLoginPage(makeAuth({ isAuthenticated: false, loading: true }))
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('shows a tagline below the heading', () => {
    renderLoginPage()
    expect(screen.getByText(/discover and rank/i)).toBeInTheDocument()
  })
})
