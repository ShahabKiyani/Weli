import { describe, it, expect } from 'vitest'
import {
  mapSupabaseError,
  isUniqueViolation,
  isNotFound,
  isRLSViolation,
  SUPABASE_ERROR_CODES,
} from '@/lib/errors'

describe('mapSupabaseError', () => {
  it('returns a generic error when passed null', () => {
    const result = mapSupabaseError(null)
    expect(result.code).toBe('UNKNOWN')
    expect(result.message).toBeTruthy()
  })

  it('maps 23505 (unique violation) to duplicate review message', () => {
    const result = mapSupabaseError({ code: SUPABASE_ERROR_CODES.UNIQUE_VIOLATION })
    expect(result.code).toBe('23505')
    expect(result.message).toMatch(/already reviewed/i)
  })

  it('maps 42501 (RLS violation) to not authorized message', () => {
    const result = mapSupabaseError({ code: SUPABASE_ERROR_CODES.RLS_VIOLATION })
    expect(result.code).toBe('42501')
    expect(result.message).toMatch(/not authorized/i)
  })

  it('maps PGRST116 (no rows) to not found message', () => {
    const result = mapSupabaseError({ code: SUPABASE_ERROR_CODES.NOT_FOUND })
    expect(result.code).toBe('PGRST116')
    expect(result.message).toMatch(/not found/i)
  })

  it('maps 23503 (foreign key violation) to a meaningful message', () => {
    const result = mapSupabaseError({ code: SUPABASE_ERROR_CODES.FOREIGN_KEY_VIOLATION })
    expect(result.code).toBe('23503')
    expect(result.message).toBeTruthy()
  })

  it('falls back to the error message for unknown codes', () => {
    const result = mapSupabaseError({ code: 'UNEXPECTED', message: 'Something went wrong' })
    expect(result.message).toBe('Something went wrong')
  })

  it('preserves the original error reference', () => {
    const original = { code: '23505', message: 'dup key' }
    const result = mapSupabaseError(original)
    expect(result.originalError).toBe(original)
  })
})

describe('error predicate helpers', () => {
  it('isUniqueViolation returns true for code 23505', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
    expect(isUniqueViolation({ code: 'OTHER' })).toBe(false)
    expect(isUniqueViolation(null)).toBe(false)
  })

  it('isNotFound returns true for PGRST116', () => {
    expect(isNotFound({ code: 'PGRST116' })).toBe(true)
    expect(isNotFound({ code: 'OTHER' })).toBe(false)
    expect(isNotFound(null)).toBe(false)
  })

  it('isRLSViolation returns true for code 42501', () => {
    expect(isRLSViolation({ code: '42501' })).toBe(true)
    expect(isRLSViolation({ code: 'OTHER' })).toBe(false)
    expect(isRLSViolation(null)).toBe(false)
  })
})
