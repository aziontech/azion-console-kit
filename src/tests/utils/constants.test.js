import { describe, it, expect } from 'vitest'

// Assuming they're exported from a module called 'constants.js'
import * as constants from '@/utils/constants'

describe('Constants Test', () => {
  it('CDN_MAXIMUM_TTL_MAX_VALUE should be 60', () => {
    expect(constants.CDN_MAXIMUM_TTL_MAX_VALUE).toBe(60)
  })

  it('CDN_MAXIMUM_TTL_MIN_VALUE should be 3', () => {
    expect(constants.CDN_MAXIMUM_TTL_MIN_VALUE).toBe(3)
  })

  it('TOAST_LIFE should be 30000', () => {
    expect(constants.TOAST_LIFE).toBe(30000)
  })

  it('TTL_MAX_VALEU_RECORDS should be 604800', () => {
    expect(constants.TTL_MAX_VALUE_RECORDS).toBe(604800)
  })
})
