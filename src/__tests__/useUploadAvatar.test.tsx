import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useUploadAvatar } from '@/hooks/useUploadAvatar'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: vi.fn() },
    from: vi.fn(),
  },
}))

const mockRefresh = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'a@b.com' },
    refreshProfile: mockRefresh,
  }),
}))

vi.mock('@/components/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return { qc, wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('useUploadAvatar', () => {
  it('uploads to storage and updates profiles.avatar_url', async () => {
    const uploadFn = vi.fn().mockResolvedValue({ error: null })
    const getPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://proj.supabase.co/storage/v1/object/public/avatars/user-1/x.png' },
    })
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: uploadFn,
      getPublicUrl,
    } as never)

    const updateEq = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: updateEq }),
    } as never)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUploadAvatar(), { wrapper })
    const file = new File(['x'], 'photo.png', { type: 'image/png' })

    await act(async () => {
      await result.current.mutateAsync(file)
    })

    expect(supabase.storage.from).toHaveBeenCalledWith('avatars')
    expect(uploadFn).toHaveBeenCalled()
    expect(supabase.from).toHaveBeenCalledWith('profiles')
    expect(updateEq).toHaveBeenCalledWith('id', 'user-1')
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('rejects files over max size', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUploadAvatar(), { wrapper })
    const large = new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', { type: 'image/png' })

    await expect(
      act(async () => { await result.current.mutateAsync(large) }),
    ).rejects.toThrow(/too large/i)
    expect(supabase.storage.from).not.toHaveBeenCalled()
  })

  it('rejects non-image MIME types', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUploadAvatar(), { wrapper })
    const bad = new File(['x'], 'x.pdf', { type: 'application/pdf' })

    await expect(
      act(async () => { await result.current.mutateAsync(bad) }),
    ).rejects.toThrow(/image/i)
  })
})
