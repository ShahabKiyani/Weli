import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { APIProvider } from '@vis.gl/react-google-maps'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/Toast'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { GOOGLE_MAPS_API_KEY, ROUTES } from '@/lib/constants'
import LoginPage from '@/pages/LoginPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import SetupUsernamePage from '@/pages/SetupUsernamePage'
import DashboardPage from '@/pages/DashboardPage'
import DiscoverPage from '@/pages/DiscoverPage'
import RestaurantDetailPage from '@/pages/RestaurantDetailPage'
import ReviewFormPage from '@/pages/ReviewFormPage'
import ProfilePage from '@/pages/ProfilePage'
import PublicProfilePage from '@/pages/PublicProfilePage'
import FeedPage from '@/pages/FeedPage'

// QueryClient singleton — created outside component to survive re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <AuthProvider>
            <ToastProvider>
            <Routes>
              {/* ── Public routes ── */}
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackPage />} />
              <Route path={ROUTES.SETUP_USERNAME} element={<SetupUsernamePage />} />

              {/* ── Protected routes (requires authenticated, non-needsUsername state) ── */}
              <Route element={<ProtectedRoute />}>
                <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                <Route path={ROUTES.DISCOVER} element={<DiscoverPage />} />
                <Route path={ROUTES.FEED} element={<FeedPage />} />
                <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
                <Route path="/restaurants/:id/review" element={<ReviewFormPage />} />
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<PublicProfilePage />} />
              </Route>

              {/* ── Fallbacks ── */}
              <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
            </Routes>
            </ToastProvider>
          </AuthProvider>
        </APIProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
