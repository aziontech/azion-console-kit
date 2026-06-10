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

  it('should require onboarding only for a first-login client with billing_type=null', () => {
    const store = useAccountStore()

    store.setAccountData({
      kind: 'client',
      first_login: true,
      billing_type: null
    })

    expect(store.needsOnboarding).toBe(true)
  })

  it('should not require onboarding for a first-login client that already has a billing_type', () => {
    const store = useAccountStore()

    store.setAccountData({
      kind: 'client',
      first_login: true,
      billing_type: 'plan'
    })

    expect(store.needsOnboarding).toBe(false)
  })

  it('should not require onboarding for a returning client even with billing_type=null', () => {
    const store = useAccountStore()

    store.setAccountData({
      kind: 'client',
      first_login: false,
      billing_type: null
    })

    expect(store.needsOnboarding).toBe(false)
  })

  it('should never require onboarding for non-client accounts', () => {
    const store = useAccountStore()

    store.setAccountData({
      kind: 'reseller',
      first_login: true,
      billing_type: null
    })

    expect(store.needsOnboarding).toBe(false)
  })
})
