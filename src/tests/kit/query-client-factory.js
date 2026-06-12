import { QueryClient } from '@tanstack/vue-query'

export const createTestQueryClient = (overrides = {}) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...(overrides.queries ?? {})
      },
      mutations: {
        retry: false,
        ...(overrides.mutations ?? {})
      }
    }
  })
