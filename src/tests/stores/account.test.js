import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAccountStore } from '@/stores/account'

describe('account store session state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should start with hasSession=false', () => {
    const store = useAccountStore()
    expect(store.hasSession).toBe(false)
  })

  it('should set hasSession=true only when explicitly marked', () => {
    const store = useAccountStore()
    store.setAccountData({ id: 1 })
    expect(store.hasSession).toBe(false)
    store.setHasSession(true)
    expect(store.hasSession).toBe(true)
  })

  it('should reset hasSession=false on resetAccount', () => {
    const store = useAccountStore()
    store.setHasSession(true)
    store.resetAccount()
    expect(store.hasSession).toBe(false)
  })

  it('should require onboarding for a first-login client with billing_type=null', () => {
    const store = useAccountStore()

    store.setAccountData({
      kind: 'client',
      first_login: true,
      billing_type: null
    })

    expect(store.needsOnboarding).toBe(true)
  })

  it('should require onboarding for a client with billing_type=null when first_login is absent', () => {
    const store = useAccountStore()

    store.setAccountData({
      kind: 'client',
      billing_type: null
    })

    expect(store.needsOnboarding).toBe(true)
  })

  it('should not require onboarding for a returning (first_login=false) client with billing_type=null', () => {
    const store = useAccountStore()

    store.setAccountData({
      kind: 'client',
      first_login: false,
      billing_type: null
    })

    expect(store.needsOnboarding).toBe(false)
  })

  it('should not require onboarding for a client that already has a billing_type', () => {
    const store = useAccountStore()

    store.setAccountData({
      kind: 'client',
      first_login: true,
      billing_type: 'plan'
    })

    expect(store.needsOnboarding).toBe(false)
  })

  it('should never require onboarding for non-client accounts', () => {
    const store = useAccountStore()

    store.setAccountData({
      kind: 'reseller',
      billing_type: null
    })

    expect(store.needsOnboarding).toBe(false)
  })
})

describe('account store billing experience', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should map billing_type=plan to the plan experience', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: 'plan' })
    expect(store.billingExperience).toBe('plan')
  })

  it('should map billing_type=null to the null experience', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: null })
    expect(store.billingExperience).toBe('null')
  })

  it('should map a missing billing_type to the null experience', () => {
    const store = useAccountStore()
    store.setAccountData({ id: 1 })
    expect(store.billingType).toBe(null)
    expect(store.billingExperience).toBe('null')
  })

  it('should map billing_type=custom to the custom experience', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: 'custom' })
    expect(store.billingExperience).toBe('custom')
  })

  it('should map billing_type=internal to the internal experience', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: 'internal' })
    expect(store.billingExperience).toBe('internal')
  })

  it('should fall back to the plan experience for an unknown billing_type', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: 'something-new' })
    expect(store.billingExperience).toBe('plan')
  })
})

describe('account store regular billing detection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should flag a REGULAR status account as regular (hide values)', () => {
    const store = useAccountStore()
    store.setAccountData({ status: 'REGULAR', billing_type: 'plan' })
    expect(store.accountIsNotRegular).toBe(false)
  })

  it('should flag a billing_type=custom account as regular regardless of status', () => {
    const store = useAccountStore()
    store.setAccountData({ status: 'ONLINE', billing_type: 'custom' })
    expect(store.accountIsNotRegular).toBe(false)
  })

  it('should not flag an ONLINE plan account as regular (show values)', () => {
    const store = useAccountStore()
    store.setAccountData({ status: 'ONLINE', billing_type: 'plan' })
    expect(store.accountIsNotRegular).toBe(true)
  })

  it('should not flag a billing_type=internal account as regular', () => {
    const store = useAccountStore()
    store.setAccountData({ status: 'ONLINE', billing_type: 'internal' })
    expect(store.accountIsNotRegular).toBe(true)
  })
})
