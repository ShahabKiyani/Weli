import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { AuthContextValue } from '@/contexts/AuthContext'

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn(),
    },
  },
}))

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    state: { status: 'loading' } as AuthContextValue['state'],
    user: null,
    profile: null,
    session: null,
    loading: true,
    needsUsername: false,
    isAuthenticated: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    ...overrides,
  }
}

function renderCallback(url = '/auth/callback?code=abc123', auth = makeAuth()) {
  vi.mocked(useAuth).mockReturnValue(auth)
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route path="/setup-username" element={<div>Setup Username Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.resetAllMocks())

describe('AuthCallbackPage', () => {
  it('shows a loading spinner while processing', () => {
    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({} as never)
    renderCallback()
    expect(screen.getByText(/completing sign-in/i)).toBeInTheDocument()
  })

  it('calls exchangeCodeForSession with the code from the URL', () => {
    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({} as never)
    renderCallback('/auth/callback?code=mycode123')
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('mycode123')
  })

  it('shows an error message when the code param is missing', () => {
    renderCallback('/auth/callback')
    expect(screen.getByText(/missing authorization code/i)).toBeInTheDocument()
  })

  it('shows an error message when the OAuth error param is present', () => {
    renderCallback('/auth/callback?error=access_denied&error_description=User+cancelled')
    expect(screen.getByText(/user cancelled/i)).toBeInTheDocument()
  })

  it('shows a generic error when error param has no description', () => {
    renderCallback('/auth/callback?error=server_error')
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument()
  })

  it('shows a Back to Login link on error', () => {
    renderCallback('/auth/callback')
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument()
  })

  it('shows an error when exchangeCodeForSession rejects', async () => {
    vi.mocked(supabase.auth.exchangeCodeForSession).mockRejectedValue(new Error('network error'))
    renderCallback('/auth/callback?code=abc')
    expect(await screen.findByText(/authentication failed/i)).toBeInTheDocument()
  })

  it('navigates to /dashboard when auth state becomes authenticated', async () => {
    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({} as never)
    const auth = makeAuth({ loading: false, isAuthenticated: true, state: { status: 'authenticated' } as AuthContextValue['state'] })
    renderCallback('/auth/callback?code=abc', auth)
    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
  })

  it('navigates to /setup-username when auth state is needs_username', async () => {
    vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({} as never)
    const auth = makeAuth({ loading: false, needsUsername: true, state: { status: 'needs_username' } as AuthContextValue['state'] })
    renderCallback('/auth/callback?code=abc', auth)
    expect(await screen.findByText('Setup Username Page')).toBeInTheDocument()
  })
})
