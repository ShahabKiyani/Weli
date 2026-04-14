import { z } from 'zod'

/**
 * Validation schema for the username field used during account setup.
 * Rules mirror the database CHECK constraint on profiles.username.
 */
export const usernameSchema = z
  .string()
  .min(3, 'Must be at least 3 characters')
  .max(30, 'Must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed')
