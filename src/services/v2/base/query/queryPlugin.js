import { VueQueryPlugin } from '@tanstack/vue-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { queryClient } from './queryClient'
import { createIDBPersister } from './indexedDbPersister'
import { PERSISTENCE_CONFIG } from './config'

let restorePromise = null
let resolveRestore = null
let rejectRestore = null
let unsubscribePersistence = null

export const persister = createIDBPersister(
  {
    idbName: PERSISTENCE_CONFIG.IDB_NAME,
    storeName: PERSISTENCE_CONFIG.IDB_STORE_NAME,
    cacheKey: PERSISTENCE_CONFIG.CACHE_KEY
  },
  (error) => {
    if (error) {
      rejectRestore(error)
    } else {
      resolveRestore()
    }
  }
)

const loadConfig = () => {
  return {
    queryClient,
    persister,
    maxAge: PERSISTENCE_CONFIG.MAX_AGE,
    buster: PERSISTENCE_CONFIG.VERSION,
    dehydrateOptions: PERSISTENCE_CONFIG.DEHYDRATE_OPTIONS,
    hydrateOptions: PERSISTENCE_CONFIG.HYDRATE_OPTIONS
  }
}

export const queryPlugin = {
  install(app) {
    restorePromise = new Promise((resolve, reject) => {
      resolveRestore = resolve
      rejectRestore = reject
    })

    const [unsubscribe] = persistQueryClient(loadConfig())
    unsubscribePersistence = unsubscribe

    app.use(VueQueryPlugin, {
      queryClient
    })

    if (typeof window !== 'undefined') {
      window.__VUE_QUERY_CLIENT__ = queryClient
    }
  }
}

export const waitForPersistenceRestore = () => restorePromise || Promise.resolve()

export const pauseQueryPersistence = async () => {
  if (unsubscribePersistence && typeof unsubscribePersistence === 'function') {
    await unsubscribePersistence()
    unsubscribePersistence = null
  }
}

export const resumeQueryPersistence = () => {
  if (unsubscribePersistence) {
    return
  }

  const [unsubscribe] = persistQueryClient(loadConfig())
  unsubscribePersistence = unsubscribe
}

export default queryPlugin
