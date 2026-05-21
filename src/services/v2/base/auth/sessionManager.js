import { clearAllCache } from '../query/queryClient'
import { persister, pauseQueryPersistence } from '@/services/v2/base/query/queryPlugin'
import { useAccountStore } from '@/stores/account'
import { sendSwitchAccountBroadcast } from '@/services/v2/base/auth/session-broadcast'
import { hasFlagBlockApiV4 } from '@/composables/user-flag'
import { startCacheSync, resetCacheSync } from '@/services/v2/base/cache-sync/cache-sync-service'
import { schedulePrefetch } from '@/services/v2/base/query/prefetchScheduler'

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
import { teamPermissionService } from '@/services/team-permission/team-permission-service'
import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
import { digitalCertificatesService } from '@/services/v2/digital-certificates/digital-certificates-service'
import { customPageService } from '@/services/v2/custom-page/custom-page-service'
import { digitalCertificatesCRLService } from '@/services/v2/digital-certificates/digital-certificates-crl-service'
import { usersService } from '@/services/v2/users/users-service'
import { personalTokenService } from '@/services/v2/personal-token/personal-token-service'
import { edgeServiceService } from '@/services/v2/edge-service/edge-service-service'
import { edgeNodeService } from '@/services/v2/edge-node/edge-node-service'

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

const prefetchInBackground = () => {
  const accountStore = useAccountStore()

  if (!accountStore.isClientAccount) {
    return
  }

  const pageSize = getPageSize()

  schedulePrefetch([
    () => solutionService.prefetchList(hasFlagBlockApiV4()),
    () => edgeAppService.prefetchList(pageSize),
    () => workloadService.prefetchList(pageSize),
    () => edgeFirewallService.prefetchList(pageSize),
    () => variablesService.prefetchList(),
    () => marketplaceService.prefetchMarketplace(),
    () => edgeStorageService.prefetchList(pageSize),
    () => edgeDNSService.prefetchList(pageSize),
    () => edgeFunctionService.prefetchList(pageSize),
    () => edgeConnectorsService.prefetchList(pageSize),
    () => dataStreamService.prefetchList(pageSize),
    () => wafService.prefetchList(pageSize),
    () => edgeSQLService.prefetchList(pageSize),
    () => teamPermissionService.prefetchList(pageSize),
    () => networkListsService.prefetchList(pageSize),
    () => digitalCertificatesService.prefetchList(pageSize),
    () => digitalCertificatesCRLService.prefetchList(pageSize),
    () => customPageService.prefetchList(pageSize),
    () => usersService.prefetchList(pageSize),
    () => personalTokenService.prefetchList(pageSize),
    () => edgeServiceService.prefetchList(pageSize),
    () => edgeNodeService.prefetchList(pageSize)
  ])
}

let hasPrefetched = false

export const sessionManager = {
  afterLogin() {
    if (hasPrefetched) return
    hasPrefetched = true
    prefetchInBackground()

    const accountStore = useAccountStore()
    if (accountStore.isClientAccount) {
      startCacheSync()
    }
  },
  /**
   * Prepares the current tab for an account switch by clearing local session data
   * (cache, persisted queries, account store). Does NOT broadcast to other tabs —
   * the caller MUST invoke `notifySwitchAccountComplete()` after the switch API
   * call succeeds. Splitting these prevents a race where other tabs reload with
   * stale credentials before the new session is ready, causing 401 → logout.
   */
  async switchAccount() {
    hasPrefetched = false
    resetCacheSync()
    await clearAllData()
  },
  /**
   * Notifies other tabs that the account switch completed successfully so they
   * can reload into the new session. MUST be called only after the switch API
   * has returned successfully and the new session is established.
   */
  notifySwitchAccountComplete() {
    sendSwitchAccountBroadcast()
  },
  async logout() {
    hasPrefetched = false
    resetCacheSync()
    await clearAllData()
  }
}
