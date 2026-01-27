import { QueryClient } from '@tanstack/vue-query'
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental'
import { getCacheOptions } from './queryOptions'
import { isProduction } from '@/helpers/get-environment'

const isProductionEnvironment = isProduction()

const baseQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...getCacheOptions()
    },
    mutations: {
      retry: 1
    }
  }
})

export const queryClient = baseQueryClient

const broadcastChannel = isProductionEnvironment ? 'app-azion-sync' : 'app-azion-sync-stage'

broadcastQueryClient({ queryClient, broadcastChannel })

export const clearAllCache = () => {
  return queryClient.clear()
}

export const cancelAllQueries = async () => {
  await queryClient.cancelQueries()
}
