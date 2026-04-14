import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCuisines } from '@/hooks/useCuisines'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => vi.resetAllMocks())

describe('useCuisines', () => {
  it('fetches cuisine_type from restaurants table', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ cuisine_type: 'Italian' }],
        error: null,
      }),
    } as never)
    const { result } = renderHook(() => useCuisines(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(vi.mocked(supabase.from)).toHaveBeenCalledWith('restaurants')
  })

  it('deduplicates cuisine types', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { cuisine_type: 'Italian' },
          { cuisine_type: 'Italian' },
          { cuisine_type: 'Mexican' },
        ],
        error: null,
      }),
    } as never)
    const { result } = renderHook(() => useCuisines(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(2)
  })

  it('returns cuisines sorted alphabetically', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { cuisine_type: 'Mexican' },
          { cuisine_type: 'American' },
          { cuisine_type: 'Italian' },
        ],
        error: null,
      }),
    } as never)
    const { result } = renderHook(() => useCuisines(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual(['American', 'Italian', 'Mexican'])
  })

  it('returns empty array when no restaurants exist', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as never)
    const { result } = renderHook(() => useCuisines(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('surfaces errors from supabase', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
    } as never)
    const { result } = renderHook(() => useCuisines(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
