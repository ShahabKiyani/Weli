import { describe, it, expect } from 'vitest'
import { AMHERST_CENTER, MAP_DEFAULTS, APP_NAME } from '@/lib/constants'

describe('constants', () => {
  describe('AMHERST_CENTER', () => {
    it('has the correct latitude', () => {
      expect(AMHERST_CENTER.lat).toBe(42.3732)
    })

    it('has the correct longitude', () => {
      expect(AMHERST_CENTER.lng).toBe(-72.5199)
    })
  })

  describe('MAP_DEFAULTS', () => {
    it('has a default zoom level', () => {
      expect(typeof MAP_DEFAULTS.zoom).toBe('number')
      expect(MAP_DEFAULTS.zoom).toBeGreaterThan(0)
    })

    it('uses Amherst center as default location', () => {
      expect(MAP_DEFAULTS.center).toEqual(AMHERST_CENTER)
    })
  })

  describe('APP_NAME', () => {
    it('is the correct app name', () => {
      expect(APP_NAME).toBe('Weli')
    })
  })
})
