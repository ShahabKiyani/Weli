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
  const toAppError = (code: string, message: string, originalError?: unknown): AppError => ({
    code,
    message,
    originalError,
  })

  if (!error) {
    return toAppError('UNKNOWN', 'An unexpected error occurred')
  }

  switch (error.code) {
    case SUPABASE_ERROR_CODES.UNIQUE_VIOLATION:
      return toAppError(error.code, "You've already reviewed this restaurant", error)
    case SUPABASE_ERROR_CODES.RLS_VIOLATION:
      return toAppError(error.code, 'You are not authorized to perform this action', error)
    case SUPABASE_ERROR_CODES.NOT_FOUND:
      return toAppError(error.code, 'The requested item was not found', error)
    case SUPABASE_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      return toAppError(error.code, 'Referenced item does not exist', error)
    default:
      return toAppError(
        error.code ?? 'UNKNOWN',
        error.message ?? 'An unexpected error occurred',
        error,
      )
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
