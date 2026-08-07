import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAccountStore } from '@/stores/account'

describe('account store setIdentity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('sets the identity as-is on a fresh store', () => {
    const store = useAccountStore()

    store.setIdentity({ id: 5, kind: 'client', name: 'Acme', isDeveloperSupportPlan: true })

    expect(store.account).toEqual({
      id: 5,
      kind: 'client',
      name: 'Acme',
      isDeveloperSupportPlan: true
    })
  })

  it('replaces identity fields without bleeding fields from the previous account', () => {
    const store = useAccountStore()

    store.setIdentity({ id: 1, name: 'Old', kind: 'client', legacyOnlyField: 'stale' })
    store.setIdentity({ id: 2, name: 'New', kind: 'reseller' })

    expect(store.account.id).toBe(2)
    expect(store.account.name).toBe('New')
    expect(store.account.kind).toBe('reseller')
    expect(store.account.legacyOnlyField).toBeUndefined()
  })

  it('keeps isFirstLogin false after completeOnboarding even when a refetch still reports true', () => {
    const store = useAccountStore()

    store.setIdentity({ id: 1, kind: 'client', first_login: true })
    store.completeOnboarding()

    expect(store.isFirstLogin).toBe(false)

    store.setIdentity({ id: 1, kind: 'client', first_login: true })

    expect(store.isFirstLogin).toBe(false)
    expect(store.account.first_login).toBe(true)
  })

  it('resets the onboarding latch when switching to another account', () => {
    const store = useAccountStore()

    store.setIdentity({ id: 1, kind: 'client', first_login: true })
    store.completeOnboarding()

    store.setIdentity({ id: 2, kind: 'client', first_login: true })

    expect(store.isFirstLogin).toBe(true)
  })

  it('follows the server first_login when onboarding was never completed locally', () => {
    const store = useAccountStore()

    store.setIdentity({ id: 1, kind: 'client', first_login: true })
    expect(store.isFirstLogin).toBe(true)

    store.setIdentity({ id: 1, kind: 'client', first_login: false })
    expect(store.isFirstLogin).toBe(false)
  })

  it('preserves additive billing/contract extras across an identity refetch', () => {
    const store = useAccountStore()

    store.setIdentity({ id: 1, kind: 'client', isDeveloperSupportPlan: true })
    store.setAccountData({
      credit: 100,
      formatCredit: '$100',
      days: 30,
      yourServicePlan: 'Business',
      isDeveloperSupportPlan: false
    })

    store.setIdentity({ id: 1, kind: 'client', isDeveloperSupportPlan: true })

    expect(store.account).toMatchObject({
      id: 1,
      kind: 'client',
      credit: 100,
      formatCredit: '$100',
      days: 30,
      yourServicePlan: 'Business',
      isDeveloperSupportPlan: false
    })
  })
})
