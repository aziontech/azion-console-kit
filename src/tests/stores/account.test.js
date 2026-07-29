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

  it('should map billing_type=null to the plan experience', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: null })
    expect(store.billingExperience).toBe('plan')
  })

  it('should map a missing billing_type to the plan experience', () => {
    const store = useAccountStore()
    store.setAccountData({ id: 1 })
    expect(store.billingType).toBe(null)
    expect(store.billingExperience).toBe('plan')
  })

  it('should flag internal and custom as managed billing accounts', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: 'internal' })
    expect(store.isManagedBillingAccount).toBe(true)
    store.setAccountData({ billing_type: 'custom' })
    expect(store.isManagedBillingAccount).toBe(true)
    store.setAccountData({ billing_type: 'plan' })
    expect(store.isManagedBillingAccount).toBe(false)
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

  it('should keep the plans experience only for plan and null', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: 'plan' })
    expect(store.isPlansBillingAccount).toBe(true)
    store.setAccountData({ billing_type: null })
    expect(store.isPlansBillingAccount).toBe(true)
    store.setAccountData({ billing_type: 'internal' })
    expect(store.isPlansBillingAccount).toBe(false)
    store.setAccountData({ billing_type: 'custom' })
    expect(store.isPlansBillingAccount).toBe(false)
  })

  it('should treat an unknown billing_type as a managed account', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: 'something-new' })
    expect(store.isPlansBillingAccount).toBe(false)
    expect(store.isManagedBillingAccount).toBe(true)
    expect(store.billingExperience).toBe('something-new')
  })
})

describe('account store billing experience from the v4 subscription', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should start with no account_mode known', () => {
    const store = useAccountStore()
    expect(store.accountMode).toBe(null)
  })

  it('should send an account_mode=custom subscription to the managed experience', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: 'plan' })
    store.setSubscriptionAccountMode('custom')
    expect(store.billingExperience).toBe('custom')
    expect(store.isManagedBillingAccount).toBe(true)
  })

  it('should keep the plans experience for account_mode=plan without billing_type', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: null })
    store.setSubscriptionAccountMode('plan')
    expect(store.billingExperience).toBe('plan')
    expect(store.isPlansBillingAccount).toBe(true)
  })

  it('should let the local billing_type override win over account_mode', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: 'plan', billing_type_overridden: true })
    store.setSubscriptionAccountMode('custom')
    expect(store.billingExperience).toBe('plan')
  })

  it('should treat an account_mode=custom account as regular regardless of status', () => {
    const store = useAccountStore()
    store.setAccountData({ status: 'ONLINE', billing_type: 'plan' })
    expect(store.accountIsNotRegular).toBe(true)
    store.setSubscriptionAccountMode('custom')
    expect(store.accountIsNotRegular).toBe(false)
  })

  it('should drop the account_mode when the identity switches to another account', () => {
    const store = useAccountStore()
    store.setIdentity({ id: 1, billing_type: 'plan' })
    store.setSubscriptionAccountMode('custom')
    store.setIdentity({ id: 1, billing_type: 'plan' })
    expect(store.accountMode).toBe('custom')
    store.setIdentity({ id: 2, billing_type: 'plan' })
    expect(store.accountMode).toBe(null)
    expect(store.billingExperience).toBe('plan')
  })

  it('should drop the account_mode on resetAccount', () => {
    const store = useAccountStore()
    store.setSubscriptionAccountMode('custom')
    store.resetAccount()
    expect(store.accountMode).toBe(null)
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
