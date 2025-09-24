// src/query/queryClient.js
import { QueryClient } from '@tanstack/vue-query'
import { reactive } from 'vue'
import { DEFAULT_QUERY_OPTIONS, SENSITIVE_QUERY_OPTIONS, CACHE_TYPE } from '@/services/v2/base/query/config'
import { setupPersistence } from '@/services/v2/base/query/persistence'

const state = reactive({ queriesEnabled: true })

export const setQueriesEnabled = (enabled) => {
  state.queriesEnabled = !!enabled
}
export const getQueriesEnabled = () => state.queriesEnabled

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { ...DEFAULT_QUERY_OPTIONS, enabled: getQueriesEnabled() }
  }
})

setupPersistence(queryClient)

export const globalOptions = () => ({ ...DEFAULT_QUERY_OPTIONS, enabled: getQueriesEnabled() })
export const sensitiveOptions = () => ({ ...SENSITIVE_QUERY_OPTIONS, enabled: getQueriesEnabled() })

export const cacheManager = {
  invalidateQuery: (key) => queryClient.invalidateQueries({ queryKey: key }),
  removeQuery: (key) => queryClient.removeQueries({ queryKey: key }),
  invalidateGlobal: () => queryClient.invalidateQueries({ queryKey: [CACHE_TYPE.GLOBAL] }),
  invalidateSensitive: () => queryClient.invalidateQueries({ queryKey: [CACHE_TYPE.SENSITIVE] }),
  clearGlobal: () => queryClient.removeQueries({ queryKey: [CACHE_TYPE.GLOBAL] }),
  clearSensitive: () => queryClient.removeQueries({ queryKey: [CACHE_TYPE.SENSITIVE] }),
  invalidateAll: () => queryClient.invalidateQueries(),
  clearAll: () => queryClient.clear()
}
