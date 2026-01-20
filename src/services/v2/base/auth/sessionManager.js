import { clearAllCache, clearCacheGlobal, cancelAllQueries } from '../query/queryClient'
import { persister, pauseQueryPersistence } from '../query/queryPlugin'
import { resetCacheSync } from '../cache-sync'
import { solutionService } from '@/services/v2/marketplace/solution-service'
import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { workloadService } from '@/services/v2/workload/workload-service'
import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
import { useAccountStore } from '@/stores/account'
import {
  sendLogoutBroadcast,
  sendSwitchAccountBroadcast,
  onLogout,
  onSwitchAccount
} from './session-broadcast'

const DEFAULT_PAGE_SIZE = 10
const STORAGE_KEY = 'tableDefinitions'

const clearAll = async () => {
  await cancelAllQueries()
  pauseQueryPersistence()
  const accountStore = useAccountStore()
  accountStore.resetAccount()
  resetCacheSync()
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
    await solutionService.ensureList(hasFlagBlockApiV4)
  },

  async lists() {
    const pageSize = getPageSizeFromStorage()
    const promises = [
      edgeAppService.ensureList(pageSize),
      workloadService.ensureList(pageSize),
      edgeFirewallService.ensureList(pageSize)
    ]
    await Promise.allSettled(promises)
  }
}

onLogout(async () => {
  await clearAll()
})

onSwitchAccount(async () => {
  await clearAll()
})

export const sessionManager = {
  async afterLogin() {
    await ensure.solutions()
    await ensure.lists()
  },
  async switchAccount() {
    sendSwitchAccountBroadcast()
    await clearAll()
  },
  async logout() {
    sendLogoutBroadcast()
    await clearAll()
  },
  async clearCacheGlobal() {
    await clearCacheGlobal()
  }
}
