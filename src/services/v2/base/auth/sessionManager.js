import { clearAllCache, clearCacheSensitive } from '../query/queryClient'
import { persister, pauseQueryPersistence } from '../query/queryPlugin'
import { solutionService } from '@/services/v2/marketplace/solution-service'
import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { workloadService } from '@/services/v2/workload/workload-service'

const DEFAULT_PAGE_SIZE = 10
const STORAGE_KEY = 'tableDefinitions'

const clearAll = async () => {
  pauseQueryPersistence()
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
    await solutionService.invalidateSolutionsCache()
    await solutionService.ensureList(hasFlagBlockApiV4)
  },

  async lists() {
    const pageSize = getPageSizeFromStorage()
    const promises = [edgeAppService.ensureList(pageSize), workloadService.ensureList(pageSize)]
    await Promise.allSettled(promises)
  }
}

export const sessionManager = {
  async afterLogin() {
    await ensure.solutions()
    await ensure.lists()
  },
  async switchAccount() {
    await clearAll()
  },
  async logout() {
    await clearAll()
  },
  async clearSensitive() {
    await clearCacheSensitive()
  }
}
