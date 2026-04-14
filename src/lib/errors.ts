export const SUPABASE_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  RLS_VIOLATION: '42501',
  NOT_FOUND: 'PGRST116',
  FOREIGN_KEY_VIOLATION: '23503',
} as const

export interface AppError {
  code: string
  message: string
  originalError?: unknown
}

type RawError = { code?: string; message?: string } | null

export function mapSupabaseError(error: RawError): AppError {
  if (!error) {
    return { code: 'UNKNOWN', message: 'An unexpected error occurred' }
  }

  switch (error.code) {
    case SUPABASE_ERROR_CODES.UNIQUE_VIOLATION:
      return {
        code: error.code,
        message: "You've already reviewed this restaurant",
        originalError: error,
      }
    case SUPABASE_ERROR_CODES.RLS_VIOLATION:
      return {
        code: error.code,
        message: 'You are not authorized to perform this action',
        originalError: error,
      }
    case SUPABASE_ERROR_CODES.NOT_FOUND:
      return {
        code: error.code,
        message: 'The requested item was not found',
        originalError: error,
      }
    case SUPABASE_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      return {
        code: error.code,
        message: 'Referenced item does not exist',
        originalError: error,
      }
    default:
      return {
        code: error.code ?? 'UNKNOWN',
        message: error.message ?? 'An unexpected error occurred',
        originalError: error,
      }
  }
}

export function isUniqueViolation(error: RawError): boolean {
  return error?.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION
}

export function isNotFound(error: RawError): boolean {
  return error?.code === SUPABASE_ERROR_CODES.NOT_FOUND
}

export function isRLSViolation(error: RawError): boolean {
  return error?.code === SUPABASE_ERROR_CODES.RLS_VIOLATION
}
