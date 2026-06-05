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

  it('should use has_service_order_plan=true as contracted plan source of truth', () => {
    const store = useAccountStore()

    store.setAccountData({
      first_login: true,
      kind: 'client',
      has_service_order_plan: true
    })

    expect(store.hasServiceOrderPlan).toBe(true)
    expect(store.needsOnboarding).toBe(false)
  })

  it('should require onboarding when has_service_order_plan=false for first client login', () => {
    const store = useAccountStore()

    store.setAccountData({
      first_login: true,
      kind: 'client',
      has_service_order_plan: false
    })

    expect(store.hasServiceOrderPlan).toBe(false)
    expect(store.needsOnboarding).toBe(true)
  })

  it('should not trust non-boolean has_service_order_plan values', () => {
    const store = useAccountStore()

    store.setAccountData({
      first_login: true,
      kind: 'client',
      has_service_order_plan: 'true'
    })

    expect(store.hasServiceOrderPlan).toBe(false)
    expect(store.needsOnboarding).toBe(true)
  })
})
