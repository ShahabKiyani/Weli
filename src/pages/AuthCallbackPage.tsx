import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/lib/constants'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { state } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Handle OAuth provider errors (e.g. user cancelled the consent screen)
    const oauthError = searchParams.get('error')
    if (oauthError) {
      const description = searchParams.get('error_description')
      setError(description ?? 'Authentication was cancelled. Please try again.')
      return
    }

    const code = searchParams.get('code')
    if (!code) {
      setError('Missing authorization code. Please try signing in again.')
      return
    }

    supabase.auth.exchangeCodeForSession(code).catch(() => {
      setError('Authentication failed. Please try again.')
    })
  }, [searchParams])

  // Once AuthProvider picks up the new session, navigate to the right page
  useEffect(() => {
    if (state.status === 'authenticated') {
      navigate(ROUTES.DASHBOARD, { replace: true })
    } else if (state.status === 'needs_username') {
      navigate(ROUTES.SETUP_USERNAME, { replace: true })
    }
  }, [state.status, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-error font-medium">{error}</p>
          <Link to={ROUTES.LOGIN} className="text-primary font-semibold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex items-center gap-3 text-text-muted">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-primary animate-spin" />
        <span>Completing sign-in…</span>
      </div>
    </div>
  )
}
