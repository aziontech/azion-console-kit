import { get, set, del, createStore } from 'idb-keyval'
import { CACHE_TYPE } from './queryOptions'
import {
  encryptSensitiveData,
  decryptSensitiveData,
  isEncryptionAvailable
} from './encryption'

/**
 * Encrypts a single query's data if it's marked as sensitive
 * @param {any} query - Query object to encrypt
 * @returns {Promise<any>} Encrypted query or null if encryption fails
 */
async function encryptQuery(query) {
  if (!query || typeof query !== 'object') {
    return query
  }

  // Check if this is a query object with sensitive cache type
  if (query.meta?.cacheType === CACHE_TYPE.SENSITIVE && query.state?.data) {
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
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to encrypt sensitive query data:', error)
        // If encryption fails, don't persist sensitive data
        return null
      }
    } else {
      // If encryption is not available, don't persist sensitive data
      // eslint-disable-next-line no-console
      console.warn('Web Crypto API not available, skipping sensitive data persistence')
      return null
    }
  }

  return query
}

/**
 * Recursively encrypts sensitive query data in the cache
 * @param {any} data - Cache data to process
 * @returns {Promise<any>} Processed cache data with sensitive data encrypted
 */
async function encryptSensitiveQueries(data) {
  if (!data || typeof data !== 'object') {
    return data
  }

  // Handle TanStack Query dehydrated cache structure
  // The cache has a structure like: { queries: [...], mutations: [...] }
  if (data.queries && Array.isArray(data.queries)) {
    const encryptedQueries = await Promise.all(
      data.queries.map((query) => encryptQuery(query))
    )
    
    // Filter out null values (failed encryptions)
    const validQueries = encryptedQueries.filter((query) => query !== null)
    
    return {
      ...data,
      queries: validQueries
    }
  }

  // Handle array of queries
  if (Array.isArray(data)) {
    const encrypted = await Promise.all(data.map((item) => encryptSensitiveQueries(item)))
    return encrypted.filter((item) => item !== null)
  }

  // Recursively process nested objects
  const processed = { ...data }
  for (const key in processed) {
    if (processed[key] && typeof processed[key] === 'object') {
      processed[key] = await encryptSensitiveQueries(processed[key])
    }
  }

  return processed
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

  // Check if this is an encrypted sensitive query
  if (
    query.meta?.cacheType === CACHE_TYPE.SENSITIVE &&
    query.meta?.encrypted === true &&
    query.state?.data
  ) {
    if (isEncryptionAvailable()) {
      try {
        return {
          ...query,
          state: {
            ...query.state,
            data: await decryptSensitiveData(query.state.data)
          },
          meta: {
            ...query.meta,
            encrypted: false
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to decrypt sensitive query data:', error)
        // If decryption fails, return null to skip this query
        return null
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('Web Crypto API not available, skipping sensitive data decryption')
      return null
    }
  }

  return query
}

/**
 * Recursively decrypts sensitive query data in the cache
 * @param {any} data - Cache data to process
 * @returns {Promise<any>} Processed cache data with sensitive data decrypted
 */
async function decryptSensitiveQueries(data) {
  if (!data || typeof data !== 'object') {
    return data
  }

  // Handle TanStack Query dehydrated cache structure
  // The cache has a structure like: { queries: [...], mutations: [...] }
  if (data.queries && Array.isArray(data.queries)) {
    const decryptedQueries = await Promise.all(
      data.queries.map((query) => decryptQuery(query))
    )
    
    // Filter out null values (failed decryptions)
    const validQueries = decryptedQueries.filter((query) => query !== null)
    
    return {
      ...data,
      queries: validQueries
    }
  }

  // Handle array of queries
  if (Array.isArray(data)) {
    const decrypted = await Promise.all(data.map((item) => decryptSensitiveQueries(item)))
    return decrypted.filter((item) => item !== null)
  }

  // Recursively process nested objects
  const processed = { ...data }
  for (const key in processed) {
    if (processed[key] && typeof processed[key] === 'object') {
      processed[key] = await decryptSensitiveQueries(processed[key])
    }
  }

  return processed
}

export function createIDBPersister(config, onRestoreComplete = null) {
  const { idbName, storeName, cacheKey } = config
  const customStore = createStore(idbName, storeName)

  return {
    persistClient: async (client) => {
      try {
        // Encrypt sensitive data before persisting
        const encryptedClient = await encryptSensitiveQueries(client)
        
        // Filter out null values (failed encryptions)
        const filteredClient = filterNullValues(encryptedClient)
        
        await set(cacheKey, filteredClient, customStore)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error persisting client with encryption:', error)
        // Fallback to unencrypted persistence if encryption fails
        await set(cacheKey, client, customStore)
      }
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

        // Decrypt sensitive data after restoring
        const decryptedClient = await decryptSensitiveQueries(client)
        
        // Filter out null values (failed decryptions)
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
      await del(cacheKey, customStore)
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
