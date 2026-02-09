import { clearAllCache } from '../query/queryClient'
import { persister, pauseQueryPersistence } from '@/services/v2/base/query/queryPlugin'
import { useAccountStore } from '@/stores/account'
import { sendSwitchAccountBroadcast } from '@/services/v2/base/auth/session-broadcast'
import { hasFlagBlockApiV4 } from '@/composables/user-flag'

import { solutionService } from '@/services/v2/marketplace/solution-service'
import { marketplaceService } from '@/services/v2/marketplace/marketplace-service'
import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { workloadService } from '@/services/v2/workload/workload-service'
import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
import { variablesService } from '@/services/v2/variables'
import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
import { edgeDNSService } from '@/services/v2/edge-dns/edge-dns-service'
import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'
import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'
import { dataStreamService } from '@/services/v2/data-stream/data-stream-service'
import { wafService } from '@/services/v2/waf/waf-service'
import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'

const STORAGE_KEY = 'tableDefinitions'
const DEFAULT_PAGE_SIZE = 10

const clearAllData = async () => {
  await pauseQueryPersistence()
  const accountStore = useAccountStore()
  accountStore.resetAccount()
  await clearAllCache()
  await persister.removeClient()
}

const getPageSize = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return stored?.numberOfLinesPerPage ?? DEFAULT_PAGE_SIZE
  } catch {
    return DEFAULT_PAGE_SIZE
  }
}

const prefetchInBackground = async () => {
  const accountStore = useAccountStore()

  if (!accountStore.isClientAccount) {
    return
  }

  const pageSize = getPageSize()

  await Promise.allSettled([
    solutionService.prefetchList(hasFlagBlockApiV4()),
    edgeAppService.prefetchList(pageSize),
    workloadService.prefetchList(pageSize),
    edgeFirewallService.prefetchList(pageSize)
  ])

  Promise.allSettled([
    variablesService.prefetchList(),
    marketplaceService.prefetchMarketplace(),
    edgeStorageService.prefetchList(pageSize),
    edgeDNSService.prefetchList(pageSize),
    edgeFunctionService.prefetchList(pageSize),
    edgeConnectorsService.prefetchList(pageSize),
    dataStreamService.prefetchList(pageSize),
    wafService.prefetchList(pageSize),
    edgeSQLService.prefetchList(pageSize)
  ])
}

export const sessionManager = {
  afterLogin() {
    queueMicrotask(prefetchInBackground)
  },
  async switchAccount() {
    await clearAllData()
    sendSwitchAccountBroadcast()
  },
  async logout() {
    await clearAllData()
  }
}
