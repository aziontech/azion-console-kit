import { clearAllCache } from '../query/queryClient'
import { persister, pauseQueryPersistence } from '../query/queryPlugin'
import { solutionService } from '@/services/v2/marketplace/solution-service'
import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { workloadService } from '@/services/v2/workload/workload-service'
import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
import { useAccountStore } from '@/stores/account'
import { sendSwitchAccountBroadcast } from './session-broadcast'

const DEFAULT_PAGE_SIZE = 10
const STORAGE_KEY = 'tableDefinitions'

const clearAllData = async () => {
  await pauseQueryPersistence()
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

const prefetchForClientAccount = async () => {
  const accountStore = useAccountStore()

  if (!accountStore.isClientAccount) {
    return
  }

  const { hasFlagBlockApiV4 } = await import('@/composables/user-flag')
  const pageSize = getPageSizeFromStorage()

  const promises = [
    solutionService.prefetchList(hasFlagBlockApiV4()),
    edgeAppService.prefetchList(pageSize),
    workloadService.prefetchList(pageSize),
    edgeFirewallService.prefetchList(pageSize)
  ]

  await Promise.allSettled(promises)
}

export const sessionManager = {
  async afterLogin() {
    await prefetchForClientAccount()
  },
  async switchAccount() {
    await clearAllData()
    sendSwitchAccountBroadcast()
  },
  async logout() {
    await clearAllData()
  }
}
