import { VueQueryPlugin } from '@tanstack/vue-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { queryClient } from './queryClient'
import { createIDBPersister } from './indexedDbPersister'
import { PERSISTENCE_CONFIG } from './config'

let restorePromise = null
let resolveRestore = null
let rejectRestore = null

export const queryPlugin = {
  install(app) {
    restorePromise = new Promise((resolve, reject) => {
      resolveRestore = resolve
      rejectRestore = reject
    })

    const persister = createIDBPersister(
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

    persistQueryClient({
      queryClient,
      persister,
      maxAge: PERSISTENCE_CONFIG.MAX_AGE,
      buster: PERSISTENCE_CONFIG.VERSION,
      dehydrateOptions: PERSISTENCE_CONFIG.DEHYDRATE_OPTIONS,
      hydrateOptions: PERSISTENCE_CONFIG.HYDRATE_OPTIONS
    })

    app.use(VueQueryPlugin, {
      queryClient
    })
  }
}

export const waitForPersistenceRestore = () => restorePromise || Promise.resolve()

export default queryPlugin
