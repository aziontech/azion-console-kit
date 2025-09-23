export class CacheManager {
  constructor() {
    this.dbName = 'azion_cache_db'
    this.storeName = 'cache_store'
    this.db = null
    this.useLocalStorage = false
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
      type: options.type || 'default'
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
}

export const cacheManager = new CacheManager()
