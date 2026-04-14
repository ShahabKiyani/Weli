import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database.types'

// ── State machine ────────────────────────────────────────────────────────────

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'needs_username'; user: User; session: Session; profile: Profile }
  | { status: 'authenticated'; user: User; session: Session; profile: Profile }

type AuthAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_UNAUTHENTICATED' }
  | { type: 'SET_NEEDS_USERNAME'; user: User; session: Session; profile: Profile }
  | { type: 'SET_AUTHENTICATED'; user: User; session: Session; profile: Profile }
  | { type: 'UPDATE_PROFILE'; profile: Profile }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { status: 'loading' }
    case 'SET_UNAUTHENTICATED':
      return { status: 'unauthenticated' }
    case 'SET_NEEDS_USERNAME':
      return {
        status: 'needs_username',
        user: action.user,
        session: action.session,
        profile: action.profile,
      }
    case 'SET_AUTHENTICATED':
      return {
        status: 'authenticated',
        user: action.user,
        session: action.session,
        profile: action.profile,
      }
    case 'UPDATE_PROFILE': {
      if (state.status !== 'authenticated' && state.status !== 'needs_username') return state
      const newStatus = action.profile.username ? 'authenticated' : 'needs_username'
      return { ...state, status: newStatus, profile: action.profile }
    }
    default:
      return state
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  state: AuthState
  // Derived convenience accessors
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  needsUsername: boolean
  isAuthenticated: boolean
  // Actions
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: 'loading' })

  const fetchAndDispatchProfile = useCallback(
    async (user: User, session: Session) => {
      const { data: profile, error } = (await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()) as { data: Profile | null; error: { code: string; message: string } | null }

      if (error || !profile) {
        dispatch({ type: 'SET_UNAUTHENTICATED' })
        return
      }

      if (profile.username === null) {
        dispatch({ type: 'SET_NEEDS_USERNAME', user, session, profile })
      } else {
        dispatch({ type: 'SET_AUTHENTICATED', user, session, profile })
      }
    },
    [],
  )

  useEffect(() => {
    // Hydrate session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAndDispatchProfile(session.user, session)
      } else {
        dispatch({ type: 'SET_UNAUTHENTICATED' })
      }
    })

    // Subscribe to future auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchAndDispatchProfile(session.user, session)
      } else {
        dispatch({ type: 'SET_UNAUTHENTICATED' })
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchAndDispatchProfile])

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    dispatch({ type: 'SET_UNAUTHENTICATED' })
  }, [])

  // Re-fetches the profile from DB and updates context state.
  // Called after the user sets their username on SetupUsernamePage.
  const refreshProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = (await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()) as { data: Profile | null; error: unknown }

    if (profile) {
      dispatch({ type: 'UPDATE_PROFILE', profile })
    }
  }, [])

  // Derive flat convenience accessors from the state machine
  const isActive = state.status === 'authenticated' || state.status === 'needs_username'
  const user = isActive ? state.user : null
  const profile = isActive ? state.profile : null
  const session = isActive ? state.session : null

  const value: AuthContextValue = {
    state,
    user,
    profile,
    session,
    loading: state.status === 'loading',
    needsUsername: state.status === 'needs_username',
    isAuthenticated: state.status === 'authenticated',
    signInWithGoogle,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ─────────────────────────────────────────────────────────────────────
// Co-locating the hook with its Provider is idiomatic; suppress the fast-refresh warning.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
