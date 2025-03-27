import { describe, it, expect } from 'vitest'

import * as constants from '@/utils/constants'

describe('Constants Test', () => {
  it('CDN_MAXIMUM_TTL_MAX_VALUE should be 60', () => {
    expect(constants.CDN_MAXIMUM_TTL_MAX_VALUE).toBe(60)
  })

  it('CDN_MAXIMUM_TTL_MIN_VALUE should be 3', () => {
    expect(constants.CDN_MAXIMUM_TTL_MIN_VALUE).toBe(3)
  })

  it('TTL_MAX_VALEU_RECORDS should be 604800', () => {
    expect(constants.TTL_MAX_VALUE_RECORDS).toBe(604800)
  })

  it('TTL_DEFAULT should be 3600', () => {
    expect(constants.TTL_DEFAULT).toBe(3600)
  })

  it('TTL_DEFAULT_ANAME should be 20', () => {
    expect(constants.TTL_DEFAULT_ANAME).toBe(20)
  })
})
