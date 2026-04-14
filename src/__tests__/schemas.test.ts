import { describe, it, expect } from 'vitest'
import { usernameSchema } from '@/lib/schemas'

describe('usernameSchema', () => {
  it('accepts a valid username', () => {
    expect(usernameSchema.safeParse('foodie').success).toBe(true)
    expect(usernameSchema.safeParse('john_doe').success).toBe(true)
    expect(usernameSchema.safeParse('User123').success).toBe(true)
  })

  it('rejects usernames shorter than 3 characters', () => {
    const result = usernameSchema.safeParse('ab')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/3 characters/i)
    }
  })

  it('accepts a username of exactly 3 characters', () => {
    expect(usernameSchema.safeParse('abc').success).toBe(true)
  })

  it('rejects usernames longer than 30 characters', () => {
    const result = usernameSchema.safeParse('a'.repeat(31))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/30 characters/i)
    }
  })

  it('accepts a username of exactly 30 characters', () => {
    expect(usernameSchema.safeParse('a'.repeat(30)).success).toBe(true)
  })

  it('rejects usernames with spaces', () => {
    expect(usernameSchema.safeParse('john doe').success).toBe(false)
  })

  it('rejects usernames with special characters other than underscore', () => {
    expect(usernameSchema.safeParse('user!').success).toBe(false)
    expect(usernameSchema.safeParse('user-name').success).toBe(false)
    expect(usernameSchema.safeParse('user.name').success).toBe(false)
    expect(usernameSchema.safeParse('user@host').success).toBe(false)
  })

  it('accepts underscores', () => {
    expect(usernameSchema.safeParse('user_name').success).toBe(true)
    expect(usernameSchema.safeParse('_leading').success).toBe(true)
    expect(usernameSchema.safeParse('trailing_').success).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(usernameSchema.safeParse('').success).toBe(false)
  })

  it('rejects non-string types', () => {
    expect(usernameSchema.safeParse(123).success).toBe(false)
    expect(usernameSchema.safeParse(null).success).toBe(false)
    expect(usernameSchema.safeParse(undefined).success).toBe(false)
  })

  it('parse() returns the trimmed validated value', () => {
    expect(usernameSchema.parse('ValidUser')).toBe('ValidUser')
  })
})
