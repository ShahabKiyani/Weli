import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const seedSql = readFileSync(resolve(__dirname, '../../supabase/seed.sql'), 'utf-8')

describe('Seed data: supabase/seed.sql', () => {
  it('targets the public.restaurants table', () => {
    expect(seedSql).toMatch(/INSERT INTO public\.restaurants/i)
  })

  it('seeds at least 20 restaurants (one latitude per restaurant)', () => {
    // Each restaurant row has exactly one latitude in the Amherst range
    const latitudes = seedSql.match(/42\.\d{4}/g) ?? []
    expect(latitudes.length).toBeGreaterThanOrEqual(20)
  })

  it('all latitudes are within the greater Amherst, MA bounding box (42.33–42.43)', () => {
    const latitudes = (seedSql.match(/42\.\d{4}/g) ?? []).map(Number)
    latitudes.forEach((lat) => {
      expect(lat).toBeGreaterThanOrEqual(42.33)
      expect(lat).toBeLessThanOrEqual(42.43)
    })
  })

  it('all longitudes are within the greater Amherst, MA bounding box (-72.59 to -72.48)', () => {
    const longitudes = (seedSql.match(/-72\.\d{4}/g) ?? []).map(Number)
    expect(longitudes.length).toBeGreaterThanOrEqual(20)
    longitudes.forEach((lng) => {
      expect(lng).toBeGreaterThanOrEqual(-72.59)
      expect(lng).toBeLessThanOrEqual(-72.48)
    })
  })

  it('includes at least 5 distinct cuisine types', () => {
    const cuisinePattern =
      /'(American|Pizza|Mexican|Japanese|Indian|Thai|Vietnamese|French|Italian|Chinese|Mediterranean|International|Cafe|Salads|Asian)'/gi
    const found = new Set<string>()
    let match: RegExpExecArray | null
    while ((match = cuisinePattern.exec(seedSql)) !== null) {
      found.add(match[1].toLowerCase())
    }
    expect(found.size).toBeGreaterThanOrEqual(5)
  })

  it('does not seed any reviews (community content only)', () => {
    expect(seedSql).not.toMatch(/INSERT INTO.*reviews/i)
  })
})
