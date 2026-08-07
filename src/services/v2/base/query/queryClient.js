import { QueryClient } from '@tanstack/vue-query'
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental'
import { getCacheOptions } from './queryOptions'
import { isProduction } from '@/helpers/get-environment'

const baseQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...getCacheOptions()
    },
    mutations: {
      retry: false
    }
  }
})

export const queryClient = baseQueryClient

let broadcastInitialized = false

// Called from queryPlugin.install() (inside bootstrap) instead of module
// scope: the channel name depends on the environment, which is only known
// after loadRuntimeConfig() resolves.
export const initQueryBroadcast = () => {
  if (broadcastInitialized) return
  broadcastInitialized = true

  const broadcastChannel = isProduction() ? 'app-azion-sync' : 'app-azion-sync-stage'
  broadcastQueryClient({ queryClient, broadcastChannel })
}

export const clearAllCache = async () => {
  await queryClient.cancelQueries()
  await queryClient.invalidateQueries()
  await queryClient.removeQueries()
  await queryClient.clear()
}
