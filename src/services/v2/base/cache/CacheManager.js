import { TIME, RETRY, CACHE_TYPE } from '../constants'

// Cryptography methods
const encrypt = (data) => {
  try {
    return btoa(JSON.stringify(data))
  } catch {
    return btoa(String(data))
  }
}

const decrypt = (encryptedData) => {
  try {
    return JSON.parse(atob(encryptedData))
  } catch {
    return atob(encryptedData)
  }
}

const serializeQueryKey = (queryKey) => {
  if (!Array.isArray(queryKey)) {
    return String(queryKey)
  }
  return queryKey
    .map((item) => {
      if (item === null || item === undefined) return 'null'
      if (typeof item === 'object') {
        try {
          return JSON.stringify(item)
        } catch {
          return 'invalid_object'
        }
      }
      return String(item)
    })
    .join('_')
}

export class CacheManager {
  constructor() {
    this.dbName = 'azion_cache_db'
    this.storeName = 'cache_store'
    this.db = null
    this.useLocalStorage = false

    // Cache configuration
    this.config = {
      cache: {
        ttl: TIME.CACHE_3_MINUTES,
        types: CACHE_TYPE
      }
    }
  }

  async initialize() {
    if (this.db || this.useLocalStorage) return

    try {
      this.db = await this._openDB()
    } catch (error) {
      this.useLocalStorage = true
    }
  }

  async _openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' })
        }
      }
    })
  }

  async set(key, data, options = {}) {
    await this.initialize()

    const entry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: options.ttl,
      type: options.type
    }

    if (this.useLocalStorage) {
      localStorage.setItem(`azion_cache_${key}`, JSON.stringify(entry))
    } else {
      const tx = this.db.transaction([this.storeName], 'readwrite')
      const store = tx.objectStore(this.storeName)
      await new Promise((resolve, reject) => {
        const request = store.put(entry)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  async _getEntry(key) {
    await this.initialize()

    if (this.useLocalStorage) {
      const stored = localStorage.getItem(`azion_cache_${key}`)
      return stored ? JSON.parse(stored) : null
    } else {
      const tx = this.db.transaction([this.storeName], 'readonly')
      return new Promise((resolve) => {
        const request = tx.objectStore(this.storeName).get(key)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => resolve(null)
      })
    }
  }

  async get(key) {
    const entry = await this._getEntry(key)

    if (!entry) return null

    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      await this.remove(key)
      return null
    }

    return entry.data
  }

  async remove(key) {
    await this.initialize()

    if (this.useLocalStorage) {
      localStorage.removeItem(`azion_cache_${key}`)
    } else {
      const tx = this.db.transaction([this.storeName], 'readwrite')
      const store = tx.objectStore(this.storeName)
      await new Promise((resolve, reject) => {
        const request = store.delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  }

  async clear(criteria = {}) {
    await this.initialize()

    if (this.useLocalStorage) {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith('azion_cache_')) {
          const entry = JSON.parse(localStorage.getItem(key) || '{}')
          if (this._matchesCriteria(entry, criteria)) {
            localStorage.removeItem(key)
          }
        }
      })
    } else {
      const tx = this.db.transaction([this.storeName], 'readwrite')
      const store = tx.objectStore(this.storeName)

      await new Promise((resolve, reject) => {
        const request = store.openCursor()
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            if (this._matchesCriteria(cursor.value, criteria)) {
              cursor.delete()
            }
            cursor.continue()
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })
    }
  }

  _matchesCriteria(entry, criteria) {
    if (criteria.type && entry.type !== criteria.type) return false
    return true
  }

  // Query cache methods
  async saveToCache(queryOrData, options = {}) {
    const { queryKey, data, global, sensitive } = options

    // Handle both query object and direct data
    let finalQueryKey, finalData, finalGlobal, finalSensitive

    if (queryOrData.queryKey) {
      // Called with query object
      const { queryKey: qKey, state, meta: qMeta } = queryOrData
      if (!state.data || !qMeta || (!qMeta.global && !qMeta.sensitive)) return

      finalQueryKey = qKey
      finalData = state.data
      finalGlobal = qMeta.global
      finalSensitive = qMeta.sensitive
    } else {
      // Called with direct data
      if (!data || (!global && !sensitive)) return

      finalQueryKey = queryKey
      finalData = data
      finalGlobal = global
      finalSensitive = sensitive
    }

    try {
      const cacheKey = serializeQueryKey(finalQueryKey)
      const dataToSave = finalSensitive ? encrypt(finalData) : finalData
      await this.set(cacheKey, dataToSave, {
        ttl: this.config.cache.ttl,
        type: finalGlobal ? this.config.cache.types.GLOBAL : this.config.cache.types.SENSITIVE
      })
    } catch (error) {
      return error
    }
  }

  async getFromCache(queryKey, isSensitive = false) {
    try {
      const cacheKey = serializeQueryKey(queryKey)
      const data = await this.get(cacheKey)
      return isSensitive && data ? decrypt(data) : data
    } catch (error) {
      return null
    }
  }

  async getInitialData(queryKey, global, sensitive) {
    const data = await this.getFromCache(queryKey, sensitive)
    return global || sensitive ? data : undefined
  }

  createCacheFirstQueryFn(queryKey, queryFn, global, sensitive) {
    return async () => {
      if (global || sensitive) {
        const cachedData = await this.getFromCache(queryKey, sensitive)
        if (cachedData) return cachedData
      }

      const result = await queryFn()
      if (result && (global || sensitive)) {
        await this.saveToCache(result, { queryKey, data: result, global, sensitive })
      }
      return result
    }
  }

  async clearSensitiveData() {
    await this.clear({ type: 'sensitive' })
  }
}

export const cacheManager = new CacheManager()

// Export cryptography and utility methods
export { encrypt, decrypt, serializeQueryKey }

// Export constants for use by other modules
export { TIME, RETRY, CACHE_TYPE }
