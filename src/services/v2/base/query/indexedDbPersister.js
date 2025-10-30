import { get, set, del, createStore } from 'idb-keyval'

export function createIDBPersister(config, onRestoreComplete = null) {
  const { idbName, storeName, cacheKey } = config
  const customStore = createStore(idbName, storeName)

  return {
    persistClient: async (client) => {
      await set(cacheKey, client, customStore)
    },
    restoreClient: async () => {
      try {
        const client = await get(cacheKey, customStore)

        if (onRestoreComplete) {
          queueMicrotask(() => onRestoreComplete(null))
        }

        return client
      } catch (error) {
        if (onRestoreComplete) {
          queueMicrotask(() => onRestoreComplete(error))
        }
        return undefined
      }
    },
    removeClient: async () => {
      await del(cacheKey, customStore)
    }
  }
}
