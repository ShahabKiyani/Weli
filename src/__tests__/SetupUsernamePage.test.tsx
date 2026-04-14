import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SetupUsernamePage from '@/pages/SetupUsernamePage'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { AuthContextValue } from '@/contexts/AuthContext'

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockUser = { id: 'user-1', email: 'test@example.com' }

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    state: { status: 'needs_username' } as AuthContextValue['state'],
    user: mockUser as never,
    profile: { id: 'user-1', username: null, avatar_url: null } as never,
    session: null,
    loading: false,
    needsUsername: true,
    isAuthenticated: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    ...overrides,
  }
}

function mockSupabaseUpdate(error: Record<string, unknown> | null = null) {
  vi.mocked(supabase.from).mockReturnValue({
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error }),
  } as never)
}

function renderSetupPage(auth = makeAuth()) {
  vi.mocked(useAuth).mockReturnValue(auth)
  return render(
    <MemoryRouter initialEntries={['/setup-username']}>
      <Routes>
        <Route path="/setup-username" element={<SetupUsernamePage />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.resetAllMocks())

describe('SetupUsernamePage', () => {
  it('renders the username input and submit button', () => {
    renderSetupPage()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('shows a validation error when username is too short (< 3 chars)', async () => {
    renderSetupPage()
    await userEvent.type(screen.getByLabelText(/username/i), 'ab')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 3/i)
  })

  it('shows a validation error when username is too long (> 30 chars)', async () => {
    renderSetupPage()
    // Use fireEvent to bypass the HTML maxLength attribute and test Zod directly
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'a'.repeat(31) },
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/at most 30/i)
  })

  it('shows a validation error for invalid characters (spaces, @, etc.)', async () => {
    renderSetupPage()
    await userEvent.type(screen.getByLabelText(/username/i), 'bad user!')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/letters, numbers/i)
  })

  it('allows alphanumeric usernames with underscores', async () => {
    mockSupabaseUpdate(null)
    renderSetupPage()
    await userEvent.type(screen.getByLabelText(/username/i), 'amherst_foodie')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('profiles'))
  })

  it('calls supabase update with trimmed username on valid submission', async () => {
    mockSupabaseUpdate(null)
    renderSetupPage()
    await userEvent.type(screen.getByLabelText(/username/i), '  amherst  ')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => {
      const updateChain = vi.mocked(supabase.from).mock.results[0].value
      expect(updateChain.update).toHaveBeenCalledWith({ username: 'amherst' })
    })
  })

  it('shows "already taken" error on unique constraint violation (23505)', async () => {
    mockSupabaseUpdate({ code: '23505', message: 'duplicate key' })
    renderSetupPage()
    await userEvent.type(screen.getByLabelText(/username/i), 'takenuser')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/already taken/i)
  })

  it('shows a generic error on other Supabase failures', async () => {
    mockSupabaseUpdate({ code: '42501', message: 'permission denied' })
    renderSetupPage()
    await userEvent.type(screen.getByLabelText(/username/i), 'validuser')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/not authorized/i)
  })

  it('calls refreshProfile and navigates to /dashboard on success', async () => {
    mockSupabaseUpdate(null)
    const refreshProfile = vi.fn().mockResolvedValue(undefined)
    renderSetupPage(makeAuth({ refreshProfile }))
    await userEvent.type(screen.getByLabelText(/username/i), 'newuser')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(refreshProfile).toHaveBeenCalledOnce())
    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
  })

  it('disables the button and shows a loading state during submission', async () => {
    // Hang the update so we can observe the loading state
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(new Promise(() => {})),
    } as never)
    renderSetupPage()
    await userEvent.type(screen.getByLabelText(/username/i), 'loadinguser')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('clears the error message when the user modifies the input', async () => {
    renderSetupPage()
    await userEvent.type(screen.getByLabelText(/username/i), 'ab')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/username/i), 'c')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('redirects to /login when user is unauthenticated', async () => {
    const auth = makeAuth({ loading: false, isAuthenticated: false, needsUsername: false, user: null, state: { status: 'unauthenticated' } as AuthContextValue['state'] })
    renderSetupPage(auth)
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('redirects to /dashboard when user is already fully authenticated', async () => {
    const auth = makeAuth({ loading: false, isAuthenticated: true, needsUsername: false, state: { status: 'authenticated' } as AuthContextValue['state'] })
    renderSetupPage(auth)
    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
  })
})
