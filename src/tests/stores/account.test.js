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

describe('account store hasAccountPlan getter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should return true when hasAccountPlan is true', () => {
    const store = useAccountStore()
    store.setAccountData({ hasAccountPlan: true })
    expect(store.hasAccountPlan).toBe(true)
  })

  it('should return true when hasAccountPlan is undefined', () => {
    const store = useAccountStore()
    store.setAccountData({ id: 1 })
    expect(store.hasAccountPlan).toBe(true)
  })

  it('should return false when hasAccountPlan is false', () => {
    const store = useAccountStore()
    store.setAccountData({ hasAccountPlan: false })
    expect(store.hasAccountPlan).toBe(false)
  })
})

describe('account store needsOnboarding getter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should return true when first_login=true and hasAccountPlan=false', () => {
    const store = useAccountStore()
    store.setAccountData({ first_login: true, hasAccountPlan: false })
    expect(store.needsOnboarding).toBe(true)
  })

  it('should return false when first_login=true but hasAccountPlan=true', () => {
    const store = useAccountStore()
    store.setAccountData({ first_login: true, hasAccountPlan: true })
    expect(store.needsOnboarding).toBe(false)
  })

  it('should return false when first_login=false and hasAccountPlan=false', () => {
    const store = useAccountStore()
    store.setAccountData({ first_login: false, hasAccountPlan: false })
    expect(store.needsOnboarding).toBe(false)
  })

  it('should return false when first_login is undefined', () => {
    const store = useAccountStore()
    store.setAccountData({ hasAccountPlan: false })
    expect(store.needsOnboarding).toBe(false)
  })
})
