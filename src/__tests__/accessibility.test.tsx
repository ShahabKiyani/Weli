import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { ConfirmModal } from '@/components/ConfirmModal'
import { RestaurantMap } from '@/components/RestaurantMap'
import { useAuth } from '@/contexts/AuthContext'
import type { AuthContextValue } from '@/contexts/AuthContext'
import type { RestaurantWithDistance } from '@/types/database.types'
import type { User } from '@supabase/supabase-js'

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))

vi.mock('@vis.gl/react-google-maps', () => ({
  Map: ({ children }: { children?: ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  AdvancedMarker: ({ children, title, onClick }: { children?: ReactNode; title?: string; onClick?: () => void }) => (
    <div data-testid={`marker-${title}`} onClick={onClick}>{children}</div>
  ),
  InfoWindow: ({ children, onCloseClick }: { children?: ReactNode; onCloseClick?: () => void }) => (
    <div data-testid="info-window">
      <button onClick={onCloseClick} aria-label="Close info window">×</button>
      {children}
    </div>
  ),
  useApiLoadingStatus: () => 'LOADED',
}))

vi.mock('@/hooks/useMapAuthError', () => ({
  useMapAuthError: () => false,
}))

vi.mock('@/components/Toast', () => ({
  useToast: () => ({ showToast: vi.fn(), toasts: [], dismissToast: vi.fn() }),
  ToastProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

function makeAuth(): AuthContextValue {
  return {
    user: { id: 'u1', email: 'test@test.com' } as unknown as User,
    profile: null,
    session: null,
    loading: false,
    isAuthenticated: true,
    needsUsername: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    state: { status: 'authenticated' } as AuthContextValue['state'],
  }
}

function renderLayout(content: ReactNode = <p>Content</p>) {
  const qc = new QueryClient()
  vi.mocked(useAuth).mockReturnValue(makeAuth())
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AppLayout>{content}</AppLayout>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const mockRestaurant: RestaurantWithDistance = {
  id: 'r1',
  name: 'Pita Pockets',
  address: '1 Main St',
  latitude: 42.37,
  longitude: -72.52,
  cuisine_type: 'Mediterranean',
  description: null,
  image_url: null,
  phone: null,
  website: null,
  google_place_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  avg_score: 8,
  review_count: 5,
}

// ── AppLayout accessibility ────────────────────────────────────────────────────

describe('AppLayout accessibility', () => {
  it('renders a skip-to-main-content link', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument()
  })

  it('skip link href targets #main-content', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute(
      'href',
      '#main-content',
    )
  })

  it('main element has id="main-content"', () => {
    renderLayout()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('main element has the fade-in animation class', () => {
    renderLayout()
    expect(screen.getByRole('main').className).toMatch(/animate-fade-in/)
  })
})

// ── ConfirmModal focus management ──────────────────────────────────────────────

describe('ConfirmModal focus management', () => {
  it('moves focus to the cancel button when the modal opens', async () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /cancel/i }))
    })
  })

  it('restores focus to the prior element when modal closes', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)
    trigger.focus()

    const { rerender } = render(
      <ConfirmModal
        isOpen={true}
        title="Confirm"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /cancel/i }))
    })

    rerender(
      <ConfirmModal
        isOpen={false}
        title="Confirm"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    await waitFor(() => expect(document.activeElement).toBe(trigger))
    document.body.removeChild(trigger)
  })
})

// ── RestaurantMap keyboard accessibility ──────────────────────────────────────

describe('RestaurantMap marker keyboard accessibility', () => {
  it('marker content has role="button" and tabIndex=0', () => {
    render(
      <MemoryRouter>
        <RestaurantMap restaurants={[mockRestaurant]} />
      </MemoryRouter>,
    )
    const markerBtn = screen.getByRole('button', { name: /pita pockets/i })
    expect(markerBtn).toHaveAttribute('tabindex', '0')
  })

  it('pressing Enter on a marker opens the InfoWindow', async () => {
    render(
      <MemoryRouter>
        <RestaurantMap restaurants={[mockRestaurant]} />
      </MemoryRouter>,
    )
    const markerBtn = screen.getByRole('button', { name: /pita pockets/i })
    markerBtn.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByTestId('info-window')).toBeInTheDocument()
  })

  it('pressing Space on a marker opens the InfoWindow', async () => {
    render(
      <MemoryRouter>
        <RestaurantMap restaurants={[mockRestaurant]} />
      </MemoryRouter>,
    )
    const markerBtn = screen.getByRole('button', { name: /pita pockets/i })
    markerBtn.focus()
    await userEvent.keyboard(' ')
    expect(screen.getByTestId('info-window')).toBeInTheDocument()
  })
})
