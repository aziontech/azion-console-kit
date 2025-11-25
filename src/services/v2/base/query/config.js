export const CACHE_TIME = {
  NO_REFETCH: 0,
  ONE_MINUTE: 1 * 60 * 1000,
  TWO_MINUTES: 2 * 60 * 1000,
  THREE_MINUTES: 3 * 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000,
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000
}

export const CACHE_TYPE = {
  GLOBAL: 'GLOBAL',
  SENSITIVE: 'SENSITIVE'
}

export const DEFAULT_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1
}

export const GLOBAL_OPTIONS = {
  ...DEFAULT_OPTIONS,
  staleTime: CACHE_TIME.THIRTY_MINUTES,
  gcTime: CACHE_TIME.TWENTY_FOUR_HOURS,
  retry: 3
}

export const SENSITIVE_OPTIONS = {
  ...DEFAULT_OPTIONS,
  staleTime: CACHE_TIME.FIVE_MINUTES,
  gcTime: CACHE_TIME.FIVE_MINUTES
}

export const NO_CACHE_OPTIONS = {
  ...DEFAULT_OPTIONS,
  staleTime: 0,
  gcTime: 0
}

export const PERSISTENCE_CONFIG = {
  IDB_NAME: 'azion',
  IDB_STORE_NAME: 'cache-store',
  CACHE_KEY: 'query-cache',
  VERSION: 'v1',
  MAX_AGE: CACHE_TIME.TWENTY_FOUR_HOURS,
  DEHYDRATE_OPTIONS: {
    shouldDehydrateQuery: (query) => {
      if (query.state.status !== 'success') {
        return false
      }

      if (query.meta?.persist === false) {
        return false
      }

      return true
    }
  },
  HYDRATE_OPTIONS: {
    defaultOptions: {
      queries: {
        gcTime: CACHE_TIME.TWENTY_FOUR_HOURS
      }
    }
  }
}

export const getCacheOptions = (cacheType) => {
  if (cacheType === CACHE_TYPE.SENSITIVE) {
    return SENSITIVE_OPTIONS
  }
  return GLOBAL_OPTIONS
}
