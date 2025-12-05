import { clearAllCache, clearCacheSensitive } from '../query/queryClient'
import { solutionService } from '@/services/v2/marketplace/solution-service'
import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { workloadService } from '@/services/v2/workload/workload-service'
import { clearAppData } from '@/helpers/clear-app-data'

const DEFAULT_PAGE_SIZE = 10
const STORAGE_KEY = 'tableDefinitions'

const getPageSizeFromStorage = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return stored?.numberOfLinesPerPage ?? DEFAULT_PAGE_SIZE
  } catch {
    return DEFAULT_PAGE_SIZE
  }
}

// ============================================================================
// Ensure Cache Strategies
// ============================================================================

const ensure = {
  async solutions() {
    const { hasFlagBlockApiV4 } = await import('@/composables/user-flag')
    await solutionService.invalidateSolutionsCache()
    solutionService.ensureList(hasFlagBlockApiV4)
  },

  async lists() {
    const pageSize = getPageSizeFromStorage()

    const promises = [edgeAppService.ensureList(pageSize), workloadService.ensureList(pageSize)]

    Promise.allSettled(promises)
  }
}

// ============================================================================
// Session Manager
// ============================================================================

export const sessionManager = {
  async afterLogin() {
    await ensure.solutions()
    ensure.lists()
  },

  async switchAccount() {
    await clearAllCache()
    ensure.lists()
  },

  async logout() {
    await clearAllCache()
    clearAppData()
  },

  async clearSensitive() {
    await clearCacheSensitive()
  }
}
