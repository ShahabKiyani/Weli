import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

/**
 * Uploads a profile image to the `avatars` Storage bucket (path `{userId}/{timestamp}.ext`)
 * and sets `profiles.avatar_url` to the public URL. Refreshes auth profile on success.
 */
export function useUploadAvatar() {
  const { user, refreshProfile } = useAuth()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('You must be signed in')
      if (file.size > MAX_BYTES) throw new Error('Image is too large (max 5 MB)')
      if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
        throw new Error('Please use a JPEG, PNG, WebP, or GIF image')
      }

      const ext =
        file.type === 'image/jpeg'
          ? 'jpg'
          : file.type === 'image/png'
            ? 'png'
            : file.type === 'image/webp'
              ? 'webp'
              : 'gif'

      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })
      if (uploadError) throw new Error(uploadError.message)

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = pub.publicUrl

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (dbError) throw new Error(dbError.message)
    },
    onSuccess: async () => {
      await refreshProfile()
      showToast('Profile photo updated', 'success')
    },
    onError: (err: Error) => {
      showToast(err.message, 'error')
    },
  })
}
