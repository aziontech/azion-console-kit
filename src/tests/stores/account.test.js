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

describe('account store hasServiceOrderPlan getter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should return true when has_service_order_plan is true', () => {
    const store = useAccountStore()
    store.setAccountData({ has_service_order_plan: true })
    expect(store.hasServiceOrderPlan).toBe(true)
  })

  it('should return true when has_service_order_plan is null', () => {
    const store = useAccountStore()
    store.setAccountData({ has_service_order_plan: null })
    expect(store.hasServiceOrderPlan).toBe(true)
  })

  it('should return true when has_service_order_plan is undefined', () => {
    const store = useAccountStore()
    store.setAccountData({ id: 1 }) // has_service_order_plan is undefined
    expect(store.hasServiceOrderPlan).toBe(true)
  })

  it('should return false when has_service_order_plan is false', () => {
    const store = useAccountStore()
    store.setAccountData({ has_service_order_plan: false })
    expect(store.hasServiceOrderPlan).toBe(false)
  })
})
