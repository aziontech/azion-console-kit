import { clearAllCache, cancelAllQueries } from '../query/queryClient'
import { persister, pauseQueryPersistence } from '../query/queryPlugin'
import { solutionService } from '@/services/v2/marketplace/solution-service'
import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { workloadService } from '@/services/v2/workload/workload-service'
import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
import { useAccountStore } from '@/stores/account'

const DEFAULT_PAGE_SIZE = 10
const STORAGE_KEY = 'tableDefinitions'

const clearAll = async () => {
  await pauseQueryPersistence()
  await cancelAllQueries()
  const accountStore = useAccountStore()
  accountStore.resetAccount()
  await clearAllCache()
  await persister.removeClient()
}

const getPageSizeFromStorage = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return stored?.numberOfLinesPerPage ?? DEFAULT_PAGE_SIZE
  } catch {
    return DEFAULT_PAGE_SIZE
  }
}

const ensure = {
  async solutions() {
    const { hasFlagBlockApiV4 } = await import('@/composables/user-flag')
    await solutionService.prefetchList(hasFlagBlockApiV4)
  },

  async lists() {
    const accountStore = useAccountStore()
    const isClientAccount = accountStore.account?.kind === 'client'

    if (isClientAccount) {
      const pageSize = getPageSizeFromStorage()
      const promises = [
        edgeAppService.prefetchList(pageSize),
        workloadService.prefetchList(pageSize),
        edgeFirewallService.prefetchList(pageSize)
      ]
      await Promise.allSettled(promises)
    }
  }
}

export const sessionManager = {
  async afterLogin() {
    ensure.solutions()
    await ensure.lists()
  },
  async switchAccount() {
    await clearAll()
  },
  async logout() {
    await clearAll()
  }
}
