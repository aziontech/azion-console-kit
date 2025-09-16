import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      keepPreviousData: true
    },
    mutations: {
      retry: 1,
      // eslint-disable-next-line no-console
      onError: (err) => console.error('Mutation Error:', err)
    }
  }
})
