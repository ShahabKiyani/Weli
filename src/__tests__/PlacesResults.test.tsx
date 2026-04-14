import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { PlacesResults } from '@/components/PlacesResults'
import type { PlaceCandidate } from '@/lib/places'

function wrapper(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

const mockPlaces: PlaceCandidate[] = [
  {
    place_id: 'ChIJ_1',
    name: 'Google Ramen',
    address: '5 Main St, Amherst, MA',
    latitude: 42.375,
    longitude: -72.52,
    cuisine_type: 'Japanese',
    image_url: 'https://example.com/photo.jpg',
  },
  {
    place_id: 'ChIJ_2',
    name: 'Google Pizza',
    address: '10 Main St, Amherst, MA',
    latitude: 42.376,
    longitude: -72.519,
    cuisine_type: 'Pizza',
    image_url: null,
  },
]

const defaultProps = {
  places: mockPlaces,
  isSearching: false,
  onImport: vi.fn(),
  importingId: null as string | null,
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('PlacesResults', () => {
  it('renders a heading', () => {
    wrapper(<PlacesResults {...defaultProps} />)
    expect(screen.getByText(/from google maps/i)).toBeInTheDocument()
  })

  it('renders one item per place candidate', () => {
    wrapper(<PlacesResults {...defaultProps} />)
    expect(screen.getByText('Google Ramen')).toBeInTheDocument()
    expect(screen.getByText('Google Pizza')).toBeInTheDocument()
  })

  it('shows the address for each result', () => {
    wrapper(<PlacesResults {...defaultProps} />)
    expect(screen.getByText('5 Main St, Amherst, MA')).toBeInTheDocument()
    expect(screen.getByText('10 Main St, Amherst, MA')).toBeInTheDocument()
  })

  it('shows the cuisine type for each result', () => {
    wrapper(<PlacesResults {...defaultProps} />)
    expect(screen.getByText('Japanese')).toBeInTheDocument()
    expect(screen.getByText('Pizza')).toBeInTheDocument()
  })

  it('renders an "Add to Weli" button for each place', () => {
    wrapper(<PlacesResults {...defaultProps} />)
    const addButtons = screen.getAllByRole('button', { name: /add.*to weli/i })
    expect(addButtons).toHaveLength(2)
  })

  it('calls onImport with the place when the Add button is clicked', async () => {
    const onImport = vi.fn()
    wrapper(<PlacesResults {...defaultProps} onImport={onImport} />)
    await userEvent.click(screen.getAllByRole('button', { name: /add.*to weli/i })[0])
    expect(onImport).toHaveBeenCalledWith(mockPlaces[0])
  })

  it('disables and shows loading on the button whose place_id matches importingId', () => {
    wrapper(<PlacesResults {...defaultProps} importingId="ChIJ_1" />)
    const buttons = screen.getAllByRole('button', { name: /add.*to weli/i })
    expect(buttons[0]).toBeDisabled()
    expect(buttons[1]).not.toBeDisabled()
  })

  it('shows a skeleton shimmer when isSearching is true (not a spinner text)', () => {
    const { container } = wrapper(
      <PlacesResults {...defaultProps} places={[]} isSearching />,
    )
    // Should show skeleton items, not the old "Searching Google Maps…" spinner text
    expect(screen.queryByText(/searching google maps/i)).not.toBeInTheDocument()
    // The skeleton shimmer uses animate-pulse
    const pulsingElements = container.querySelectorAll('.animate-pulse')
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it('shows the section heading even when searching (so layout does not jump)', () => {
    wrapper(<PlacesResults {...defaultProps} places={[]} isSearching />)
    expect(screen.getByText(/from google maps/i)).toBeInTheDocument()
  })

  it('renders nothing when there are no places and not searching', () => {
    const { container } = wrapper(
      <PlacesResults {...defaultProps} places={[]} isSearching={false} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows Google attribution text', () => {
    wrapper(<PlacesResults {...defaultProps} />)
    expect(screen.getByText(/powered by google/i)).toBeInTheDocument()
  })

  it('shows a thumbnail image when image_url is provided', () => {
    wrapper(<PlacesResults {...defaultProps} />)
    const img = screen.getByRole('img', { name: 'Google Ramen' })
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('shows a fallback emoji placeholder when image_url is null', () => {
    wrapper(<PlacesResults {...defaultProps} places={[mockPlaces[1]]} />)
    expect(screen.queryByRole('img', { name: 'Google Pizza' })).not.toBeInTheDocument()
  })
})
