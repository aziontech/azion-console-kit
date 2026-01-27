export const toMilliseconds = ({ days = 0, hours = 0, minutes = 0, seconds = 0 } = {}) => {
  return days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000
}

export const PERSISTENCE_CONFIG = {
  IDB_NAME: 'azion',
  IDB_STORE_NAME: 'cache-store',
  CACHE_KEY: 'query-cache',
  VERSION: 'v0',
  MAX_AGE: toMilliseconds({ hours: 1 }),
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
        gcTime: toMilliseconds({ hours: 1 }) 
      } 
    } 
  }
}
