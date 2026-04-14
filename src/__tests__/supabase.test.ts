import { describe, it, expect } from 'vitest'
import { supabase } from '@/lib/supabase'

describe('supabase client', () => {
  it('is exported as a named export', () => {
    expect(supabase).toBeDefined()
  })

  it('exposes the auth interface', () => {
    expect(supabase.auth).toBeDefined()
    expect(typeof supabase.auth.signInWithOAuth).toBe('function')
    expect(typeof supabase.auth.signOut).toBe('function')
    expect(typeof supabase.auth.getSession).toBe('function')
    expect(typeof supabase.auth.onAuthStateChange).toBe('function')
  })

  it('exposes the database query interface', () => {
    expect(typeof supabase.from).toBe('function')
  })
})
