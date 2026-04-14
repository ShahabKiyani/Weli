import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/lib/constants'

function LoadingScreen() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="min-h-screen bg-surface flex items-center justify-center"
    >
      <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
    </div>
  )
}

export function ProtectedRoute() {
  const { loading, isAuthenticated, needsUsername } = useAuth()

  if (loading) return <LoadingScreen />

  // No session at all → go to login
  if (!isAuthenticated && !needsUsername) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  // Has a session but username not yet set → finish onboarding
  if (needsUsername) {
    return <Navigate to={ROUTES.SETUP_USERNAME} replace />
  }

  return <Outlet />
}
