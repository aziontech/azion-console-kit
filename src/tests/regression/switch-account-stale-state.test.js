import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/v2/account', () => ({
  accountService: { getAccountIdentity: vi.fn() },
  contractService: {}
}))
vi.mock('@/services/v2/billing/billing-gql-service', () => ({ billingGqlService: {} }))
vi.mock('@/composables/user-flag', () => ({ setFeatureFlags: vi.fn() }))

import { PERSISTENCE_CONFIG } from '@/services/v2/base/query/config'
import { loadUserAndAccountInfo } from '@/helpers/account-data'
import { accountService } from '@/services/v2/account'
import { setFeatureFlags } from '@/composables/user-flag'
import { useAccountStore } from '@/stores/account'

const { shouldDehydrateQuery } = PERSISTENCE_CONFIG.DEHYDRATE_OPTIONS

describe('ENG-46685: switch account must never keep the old/stale account', () => {
  describe('mechanism 1 — account identity is never persisted (nothing stale survives the reload)', () => {
    it('excludes the identity query (meta.persist=false) from persistence', () => {
      const identityQuery = { state: { status: 'success' }, meta: { persist: false } }

      expect(shouldDehydrateQuery(identityQuery)).toBe(false)
    })

    it('still persists normal successful queries', () => {
      const listQuery = { state: { status: 'success' }, meta: {} }

      expect(shouldDehydrateQuery(listQuery)).toBe(true)
    })

    it('never persists a non-success query', () => {
      const pendingQuery = { state: { status: 'pending' }, meta: {} }

      expect(shouldDehydrateQuery(pendingQuery)).toBe(false)
    })
  })

  describe('mechanism 2/3 — after a switch, the store reflects the freshly fetched account', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      setActivePinia(createPinia())
    })

    it('replaces the old identity with the new account and drops stale fields', async () => {
      const store = useAccountStore()

      store.setIdentity({
        id: 100,
        name: '7706t',
        kind: 'client',
        client_id: 'client-100',
        staleOnlyField: 'from-old-account'
      })
      store.setAccountData({ credit: 99, formatCredit: '$99', yourServicePlan: 'Business' })

      accountService.getAccountIdentity.mockResolvedValue({
        id: 200,
        name: 'other-client',
        kind: 'client',
        client_id: 'client-200',
        client_flags: ['flag_new']
      })

      await loadUserAndAccountInfo()

      expect(store.account.id).toBe(200)
      expect(store.account.name).toBe('other-client')
      expect(store.account.client_id).toBe('client-200')
      expect(store.account.staleOnlyField).toBeUndefined()

      expect(store.account.credit).toBe(99)
      expect(store.account.yourServicePlan).toBe('Business')

      expect(setFeatureFlags).toHaveBeenCalledWith(['flag_new'])
    })
  })
})
