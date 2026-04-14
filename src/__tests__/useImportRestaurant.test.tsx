import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useImportRestaurant } from '@/hooks/useImportRestaurant'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockRestaurant = {
  name: 'New Place',
  address: '10 Main St, Amherst, MA',
  latitude: 42.375,
  longitude: -72.52,
  cuisine_type: 'American',
  google_place_id: 'ChIJ_test',
  image_url: null,
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('useImportRestaurant', () => {
  it('calls supabase.from("restaurants").insert() with the restaurant data', async () => {
    const mockSelect = vi.fn().mockResolvedValue({
      data: [{ id: 'new-uuid', ...mockRestaurant }],
      error: null,
    })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useImportRestaurant(), { wrapper })
    result.current.mutate(mockRestaurant)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('restaurants')
    expect(mockInsert).toHaveBeenCalledWith(mockRestaurant)
  })

  it('returns the inserted restaurant on success', async () => {
    const inserted = { id: 'new-uuid', ...mockRestaurant }
    const mockSelect = vi.fn().mockResolvedValue({ data: [inserted], error: null })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useImportRestaurant(), { wrapper })
    result.current.mutate(mockRestaurant)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(inserted)
  })

  it('reports an error when the insert fails', async () => {
    const mockSelect = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key' },
    })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useImportRestaurant(), { wrapper })
    result.current.mutate(mockRestaurant)

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
