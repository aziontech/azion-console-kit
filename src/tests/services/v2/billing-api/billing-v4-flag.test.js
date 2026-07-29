import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  BILLING_V4_STORAGE_KEY,
  isBillingV4Enabled
} from '@/services/v2/billing-api/billing-v4-flag'

const setEnv = (value) => {
  vi.stubEnv('VITE_BILLING_V4', value)
}

describe('isBillingV4Enabled', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    window.localStorage.clear()
  })

  it('defaults to false so the legacy flow stays the default', () => {
    expect(isBillingV4Enabled()).toBe(false)
  })

  it.each(['1', 'true', 'on', 'enabled', 'TRUE', ' On '])('enables via env %s', (value) => {
    setEnv(value)
    expect(isBillingV4Enabled()).toBe(true)
  })

  it.each(['0', 'false', 'off', 'disabled'])('stays disabled via env %s', (value) => {
    setEnv(value)
    expect(isBillingV4Enabled()).toBe(false)
  })

  it('falls back to localStorage when the env is unset', () => {
    window.localStorage.setItem(BILLING_V4_STORAGE_KEY, 'true')
    expect(isBillingV4Enabled()).toBe(true)
  })

  it('gives the env precedence over localStorage', () => {
    setEnv('false')
    window.localStorage.setItem(BILLING_V4_STORAGE_KEY, 'true')
    expect(isBillingV4Enabled()).toBe(false)
  })

  it('ignores unrecognized values', () => {
    setEnv('maybe')
    expect(isBillingV4Enabled()).toBe(false)
  })
})
