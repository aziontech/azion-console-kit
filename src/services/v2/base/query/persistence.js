import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { createStore, get, set, del } from 'idb-keyval'
import { isSensitiveKey } from '@/services/v2/base/query/keys'
import { CACHE_TIME, CACHE_TYPE } from '@/services/v2/base/query/config'
import { encrypt, decrypt } from '@/services/v2/base/query/crypto'

const azionStore = new createStore('azion_cache', 'queries')

function createIDBPersister(prefix, isSensitive = false) {
  return createAsyncStoragePersister({
    key: 'CACHE',
    storage: {
      getItem: (key) =>
        get(`${prefix}_${key}`, azionStore).then((val) =>
          isSensitive && val ? decrypt(val) : val
        ),
      setItem: (key, value) => {
        const finalValue = isSensitive ? encrypt(value) : value
        return set(`${prefix}_${key}`, finalValue, azionStore)
      },
      removeItem: (key) => del(`${prefix}_${key}`, azionStore)
    }
  })
}

function createLocalStoragePersister(prefix, isSensitive = false) {
  return createAsyncStoragePersister({
    key: 'CACHE',
    storage: {
      getItem: (key) => {
        const val = localStorage.getItem(`${prefix}_${key}`)
        return Promise.resolve(isSensitive && val ? decrypt(val) : val)
      },
      setItem: (key, value) => {
        const finalValue = isSensitive ? encrypt(value) : value
        localStorage.setItem(`${prefix}_${key}`, finalValue)
        return Promise.resolve()
      },
      removeItem: (key) => {
        localStorage.removeItem(`${prefix}_${key}`)
        return Promise.resolve()
      }
    }
  })
}

export function setupPersistence(queryClient) {
  const supportsIDB = typeof indexedDB !== 'undefined'

  const globalPersister = supportsIDB
    ? createIDBPersister(CACHE_TYPE.GLOBAL, false)
    : createLocalStoragePersister(CACHE_TYPE.GLOBAL, false)

  const sensitivePersister = supportsIDB
    ? createIDBPersister(CACHE_TYPE.SENSITIVE, true)
    : createLocalStoragePersister(CACHE_TYPE.SENSITIVE, true)

  persistQueryClient({
    queryClient,
    persister: globalPersister,
    maxAge: CACHE_TIME.TWENTY_FOUR_HOURS,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        const key = Array.isArray(query.queryKey) ? query.queryKey : [query.queryKey]
        return !isSensitiveKey(key) && query.state.status === 'success'
      }
    }
  })

  persistQueryClient({
    queryClient,
    persister: sensitivePersister,
    maxAge: CACHE_TIME.THREE_MINUTES,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        isSensitiveKey(query.queryKey) && query.state.status === 'success'
    }
  })
}
