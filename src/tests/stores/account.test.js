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

describe('account store billing screen gate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should flag a REGULAR status account as regular', () => {
    const store = useAccountStore()
    store.setAccountData({ status: 'REGULAR' })
    expect(store.isRegularAccount).toBe(true)
    expect(store.accountIsNotRegular).toBe(false)
  })

  it.each(['TRIAL', 'ONLINE', 'BLOCKED', 'DEFAULTING'])(
    'should keep a %s account on the plans experience',
    (status) => {
      const store = useAccountStore()
      store.setAccountData({ status })
      expect(store.isRegularAccount).toBe(false)
      expect(store.accountIsNotRegular).toBe(true)
    }
  )

  it('should not flag an account without status as regular', () => {
    const store = useAccountStore()
    store.setAccountData({ id: 1 })
    expect(store.isRegularAccount).toBe(false)
    expect(store.accountIsNotRegular).toBe(true)
  })
})

describe('account store current plan', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should start with no plan known', () => {
    const store = useAccountStore()
    expect(store.currentPlanSku).toBe(null)
    expect(store.isHobbyPlan).toBe(false)
    expect(store.isProPlan).toBe(false)
  })

  it('should expose the plan set from the subscription', () => {
    const store = useAccountStore()
    store.setCurrentPlan('pro')
    expect(store.isProPlan).toBe(true)
    expect(store.isHobbyPlan).toBe(false)
    store.setCurrentPlan('hobby')
    expect(store.isHobbyPlan).toBe(true)
  })

  it('should drop the plan when the identity switches to another account', () => {
    const store = useAccountStore()
    store.setIdentity({ id: 1 })
    store.setCurrentPlan('pro')
    store.setIdentity({ id: 1 })
    expect(store.currentPlanSku).toBe('pro')
    store.setIdentity({ id: 2 })
    expect(store.currentPlanSku).toBe(null)
  })

  it('should drop the plan on resetAccount', () => {
    const store = useAccountStore()
    store.setCurrentPlan('pro')
    store.resetAccount()
    expect(store.currentPlanSku).toBe(null)
  })
})
