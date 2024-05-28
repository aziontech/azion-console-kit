import { describe, it, expect } from 'vitest'

import {
  CDN_MAXIMUM_TTL_MAX_VALUE,
  CDN_MAXIMUM_TTL_MIN_VALUE,
  TOAST_LIFE,
  TTL_MAX_VALEU_RECORDS
} from '@/utils/constants'

describe('Constants', () => {
  it('CDN_MAXIMUM_TTL_MAX_VALUE should be 60', () => {
    expect(CDN_MAXIMUM_TTL_MAX_VALUE).toBe(60)
  })

  it('CDN_MAXIMUM_TTL_MIN_VALUE should be 3', () => {
    expect(CDN_MAXIMUM_TTL_MIN_VALUE).toBe(3)
  })

  it('TOAST_LIFE should be 30000', () => {
    expect(TOAST_LIFE).toBe(30000)
  })

  it('TTL_MAX_VALEU_RECORDS should be 604800', () => {
    expect(TTL_MAX_VALEU_RECORDS).toBe(604800)
  })
})
