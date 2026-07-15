import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const identityData = ref(null)

vi.mock('@/services/v2/account', () => ({
  accountService: {
    useQuery: vi.fn(() => ({ data: identityData })),
    fetchAccountIdentity: vi.fn()
  }
}))

import { accountService } from '@/services/v2/account'
import { useAccountStore } from '@/stores/account'
import { useAccountSync } from '@/composables/use-account-sync'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

const runInScope = (fn) => {
  const scope = effectScope()
  scope.run(fn)
  return scope
}

describe('useAccountSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    identityData.value = null
    setActivePinia(createPinia())
  })

  it('reads the account/info query with persistence disabled and staleTime 0', () => {
    runInScope(() => useAccountSync())

    expect(accountService.useQuery).toHaveBeenCalledWith(
      queryKeys.account.info(),
      expect.any(Function),
      expect.objectContaining({ persist: false, staleTime: 0 })
    )
  })

  it('mirrors the query data into the store as it changes (reactive single writer)', async () => {
    const store = useAccountStore()
    runInScope(() => useAccountSync())

    identityData.value = { id: 2, kind: 'client', name: 'Account B' }
    await nextTick()
    expect(store.account.id).toBe(2)
    expect(store.account.name).toBe('Account B')

    identityData.value = { id: 3, kind: 'reseller', name: 'Account C' }
    await nextTick()
    expect(store.account.id).toBe(3)
    expect(store.account.name).toBe('Account C')
    expect(store.account.kind).toBe('reseller')
  })

  it('does not write to the store while the query has no data', async () => {
    const store = useAccountStore()
    runInScope(() => useAccountSync())

    await nextTick()

    expect(store.account).toEqual({})
  })
})
