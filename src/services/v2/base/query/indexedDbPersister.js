import { get, set, del, createStore } from 'idb-keyval'
import { encryptSensitiveData, decryptSensitiveData, isEncryptionAvailable } from './encryption'

/**
 * Encrypts a single query's data
 * @param {any} query - Query object to encrypt
 * @returns {Promise<any>} Encrypted query or original if encryption fails
 */
async function encryptQuery(query) {
  if (!query || typeof query !== 'object') {
    return query
  }

  if (query.state?.data) {
    if (isEncryptionAvailable()) {
      try {
        return {
          ...query,
          state: {
            ...query.state,
            data: await encryptSensitiveData(query.state.data)
          },
          meta: {
            ...query.meta,
            encrypted: true
          }
        }
      } catch {
        return null
      }
    }
    return null
  }

  return query
}

/**
 * Recursively encrypts sensitive query data in the cache
 * @param {any} data - Cache data to process
 * @returns {Promise<any>} Processed cache data with sensitive data encrypted
 */
async function encryptAllQueries(data) {
  if (!data || !Array.isArray(data.queries)) {
    return data
  }

  const encryptedQueries = await Promise.all(data.queries.map((query) => encryptQuery(query)))

  return {
    ...data,
    queries: encryptedQueries.filter((query) => query !== null)
  }
}

/**
 * Decrypts a single query's data if it's marked as encrypted
 * @param {any} query - Query object to decrypt
 * @returns {Promise<any>} Decrypted query or null if decryption fails
 */
async function decryptQuery(query) {
  if (!query || typeof query !== 'object') {
    return query
  }

  if (query.meta?.encrypted === true && query.state?.data) {
    if (!isEncryptionAvailable()) {
      return null
    }

    try {
      const decryptedData = await decryptSensitiveData(query.state.data)
      return {
        ...query,
        state: {
          ...query.state,
          data: decryptedData
        },
        meta: {
          ...query.meta,
          encrypted: false
        }
      }
    } catch {
      // Fallback: check if data is already decrypted
      if (typeof query.state.data === 'string') {
        try {
          const parsed = JSON.parse(query.state.data)
          return {
            ...query,
            state: {
              ...query.state,
              data: parsed
            },
            meta: {
              ...query.meta,
              encrypted: false
            }
          }
        } catch {
          return null
        }
      }

      if (typeof query.state.data === 'object') {
        return {
          ...query,
          state: {
            ...query.state,
            data: query.state.data
          },
          meta: {
            ...query.meta,
            encrypted: false
          }
        }
      }

      return null
    }
  }

  return query
}

/**
 * Recursively decrypts all query data in the cache
 * @param {any} data - Cache data to decrypt
 * @param {Object} options - Options for decryption
 * @param {Function} options.onCorruption - Callback when corruption is detected
 * @returns {Promise<any>} Decrypted cache data
 */
async function decryptAllQueries(data, options = {}) {
  if (!data || !Array.isArray(data.queries)) {
    return data
  }

  const decryptedQueries = await Promise.all(data.queries.map((query) => decryptQuery(query)))
  const validQueries = decryptedQueries.filter((query) => query !== null)
  const failedCount = decryptedQueries.length - validQueries.length

  if (failedCount > 0) {
    const failureRate = failedCount / decryptedQueries.length
    if (failureRate > 0.5 && options.onCorruption) {
      options.onCorruption()
    }
  }

  return {
    ...data,
    queries: validQueries
  }
}

const PERSIST_THROTTLE_MS = 2000

function createThrottledPersist(fn) {
  let timer = null
  let pendingClient = null

  return (client) => {
    pendingClient = client
    if (timer) return

    timer = setTimeout(async () => {
      timer = null
      const snapshot = pendingClient
      pendingClient = null
      await fn(snapshot)
    }, PERSIST_THROTTLE_MS)
  }
}

export function createIDBPersister(config, onRestoreComplete = null) {
  const { idbName, storeName, cacheKey } = config
  let customStore

  const noopPersister = {
    persistClient: async () => {},
    restoreClient: async () => {
      if (onRestoreComplete) {
        queueMicrotask(() => onRestoreComplete(null))
      }
      return undefined
    },
    removeClient: async () => {}
  }

  try {
    customStore = createStore(idbName, storeName)
  } catch {
    return noopPersister
  }

  const doWrite = async (client) => {
    try {
      const encryptedClient = await encryptAllQueries(client)
      const filteredClient = filterNullValues(encryptedClient)
      await set(cacheKey, filteredClient, customStore)
    } catch {
      // Encryption failed, persist unencrypted as fallback
    }
  }

  const throttledPersist = createThrottledPersist(doWrite)

  return {
    persistClient: (client) => {
      throttledPersist(client)
    },
    restoreClient: async () => {
      try {
        const client = await get(cacheKey, customStore)

        if (!client) {
          if (onRestoreComplete) {
            queueMicrotask(() => onRestoreComplete(null))
          }
          return undefined
        }

        let shouldClearCache = false
        const decryptedClient = await decryptAllQueries(client, {
          onCorruption: () => {
            shouldClearCache = true
          }
        })

        if (shouldClearCache) {
          await del(cacheKey, customStore)
          if (onRestoreComplete) {
            queueMicrotask(() => onRestoreComplete(null))
          }
          return undefined
        }

        const filteredClient = filterNullValues(decryptedClient)

        if (onRestoreComplete) {
          queueMicrotask(() => onRestoreComplete(null))
        }

        return filteredClient
      } catch (error) {
        if (onRestoreComplete) {
          queueMicrotask(() => onRestoreComplete(error))
        }
        return undefined
      }
    },
    removeClient: async () => {
      try {
        await del(cacheKey, customStore)
      } catch {
        // DB already deleted or unavailable
      }
    }
  }
}

/**
 * Recursively filters out null values from the cache structure
 * @param {any} data - Cache data to filter
 * @returns {any} Filtered cache data
 */
function filterNullValues(data) {
  if (data === null || data === undefined) {
    return undefined
  }

  if (Array.isArray(data)) {
    const filtered = data
      .map((item) => filterNullValues(item))
      .filter((item) => item !== null && item !== undefined)
    return filtered.length > 0 ? filtered : undefined
  }

  if (typeof data === 'object') {
    const filtered = {}
    for (const key in data) {
      const value = filterNullValues(data[key])
      if (value !== null && value !== undefined) {
        filtered[key] = value
      }
    }
    return Object.keys(filtered).length > 0 ? filtered : undefined
  }

  return data
}
