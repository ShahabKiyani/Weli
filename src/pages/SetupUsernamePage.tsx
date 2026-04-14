import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { isUniqueViolation, mapSupabaseError } from '@/lib/errors'
import { usernameSchema } from '@/lib/schemas'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { APP_NAME, ROUTES } from '@/lib/constants'

export default function SetupUsernamePage() {
  useDocumentTitle('Set Up Username')
  const navigate = useNavigate()
  const { user, loading, isAuthenticated, needsUsername, refreshProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Route guards: redirect when auth state is resolved but this page doesn't apply
  useEffect(() => {
    if (loading) return
    if (isAuthenticated && !needsUsername) {
      navigate(ROUTES.DASHBOARD, { replace: true })
    } else if (!isAuthenticated && !needsUsername) {
      navigate(ROUTES.LOGIN, { replace: true })
    }
  }, [loading, isAuthenticated, needsUsername, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError(null)

    const trimmed = username.trim()
    const result = usernameSchema.safeParse(trimmed)
    if (!result.success) {
      setFieldError(result.error.errors[0].message)
      return
    }

    if (!user) {
      setFieldError('You must be signed in to set a username.')
      return
    }

    setSubmitting(true)
    try {
      // Supabase generic types sometimes infer `never` for `.update()` args —
      // cast the table reference to bypass while keeping the result typed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = (await (supabase.from('profiles') as any)
        .update({ username: result.data })
        .eq('id', user.id)) as { error: { code: string; message: string } | null }

      if (error) {
        if (isUniqueViolation(error)) {
          setFieldError('This username is already taken. Please choose another.')
        } else {
          setFieldError(mapSupabaseError(error).message)
        }
        return
      }

      await refreshProfile()
      navigate(ROUTES.DASHBOARD, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="bg-card rounded-2xl p-8 border border-border w-full max-w-sm">
        <h1 className="text-2xl font-bold text-secondary text-center mb-2">{APP_NAME}</h1>
        <p className="text-sm text-text-muted text-center mb-8">
          Choose a username to finish setting up your account.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="username"
            label="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setFieldError(null)
            }}
            placeholder="e.g. amherst_foodie"
            error={fieldError ?? undefined}
            maxLength={30}
            autoFocus
            autoComplete="username"
          />
          <p className="text-xs text-text-muted mt-1.5 mb-6">
            3–30 characters · letters, numbers, and underscores only
          </p>
          <Button type="submit" loading={submitting} className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  )
}
