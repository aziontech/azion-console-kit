import { openDB } from 'idb'
import { PERSISTENCE_CONFIG } from './config'

let db = null

const getDB = async () => {
  if (!db) {
    db = await openDB(PERSISTENCE_CONFIG.DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('queries', { keyPath: 'queryKey' })
      }
    })
  }
  return db
}

const createQueryKey = (queryKey) => {
  return JSON.stringify(queryKey)
}

export const indexedDbPersister = {
  async testIndexedDB() {
    try {
      const database = await getDB()
      const testKey = 'test-key'
      const testData = { queryKey: testKey, data: 'test-value', timestamp: Date.now() }

      await database.put('queries', testData)
      const result = await database.get('queries', testKey)
      await database.delete('queries', testKey)

      return { success: true, message: 'IndexedDB working correctly', value: result?.data }
    } catch (error) {
      return { success: false, message: 'IndexedDB test failed', error: error.message }
    }
  },

  async manualTest() {
    const results = {
      testIndexedDB: await this.testIndexedDB(),
      canAccessIndexedDB: typeof indexedDB !== 'undefined',
      canAccessIdb: typeof openDB !== 'undefined',
      localStorageAvailable: typeof localStorage !== 'undefined'
    }

    window.indexedDBTestResults = results
    return results
  },

  async quickTest() {
    try {
      const testQuery = { queryKey: ['test'], data: 'quick-test', timestamp: Date.now() }
      await this.persistQuery(testQuery.queryKey, testQuery.data)

      const restored = await this.restoreQuery(testQuery.queryKey)

      await this.removeQuery(testQuery.queryKey)

      return {
        success: true,
        message: 'Quick test passed',
        restored: !!restored,
        lastPersist: window.debugIndexedDB?.lastPersist || 'unknown'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Quick test failed',
        error: error.message
      }
    }
  },

  // Persist individual query
  async persistQuery(queryKey, data) {
    try {
      const database = await getDB()
      const key = createQueryKey(queryKey)
      const queryData = {
        queryKey: key,
        data: data,
        timestamp: Date.now()
      }

      await database.put('queries', queryData)
      // Temporary debug log
      window.debugIndexedDB = { lastPersist: 'IndexedDB (idb)', timestamp: Date.now() }
    } catch (error) {
      const key = createQueryKey(queryKey)
      localStorage.setItem(
        `query-${key}`,
        JSON.stringify({
          data: data,
          timestamp: Date.now()
        })
      )
      window.debugIndexedDB = {
        lastPersist: 'localStorage',
        timestamp: Date.now(),
        error: error.message
      }
    }
  },

  // Restore individual query
  async restoreQuery(queryKey) {
    try {
      const database = await getDB()
      const key = createQueryKey(queryKey)
      const result = await database.get('queries', key)

      if (!result) {
        return undefined
      }

      if (Date.now() - result.timestamp > PERSISTENCE_CONFIG.MAX_AGE) {
        await this.removeQuery(queryKey)
        return undefined
      }

      return result.data
    } catch (error) {
      // Fallback to localStorage
      try {
        const key = createQueryKey(queryKey)
        const fallbackData = localStorage.getItem(`query-${key}`)
        if (!fallbackData) return undefined

        const parsed = JSON.parse(fallbackData)
        if (Date.now() - parsed.timestamp > PERSISTENCE_CONFIG.MAX_AGE) {
          localStorage.removeItem(`query-${key}`)
          return undefined
        }

        return parsed.data
      } catch (fallbackError) {
        return undefined
      }
    }
  },

  // Remove individual query
  async removeQuery(queryKey) {
    try {
      const database = await getDB()
      const key = createQueryKey(queryKey)
      await database.delete('queries', key)
    } catch (error) {
      // Failed to remove from IndexedDB
    }

    try {
      const key = createQueryKey(queryKey)
      localStorage.removeItem(`query-${key}`)
    } catch (error) {
      // Failed to remove from localStorage
    }
  },

  // Persist all queries (for compatibility)
  async persistClient(queries) {
    if (!Array.isArray(queries)) return

    for (const query of queries) {
      if (query.queryKey && query.state) {
        await this.persistQuery(query.queryKey, query.state.data)
      }
    }
  },

  // Restore all queries (for compatibility)
  async restoreClient() {
    try {
      const database = await getDB()
      const allQueries = await database.getAll('queries')

      const validQueries = []
      for (const query of allQueries) {
        if (Date.now() - query.timestamp <= PERSISTENCE_CONFIG.MAX_AGE) {
          validQueries.push({
            queryKey: JSON.parse(query.queryKey),
            state: { data: query.data }
          })
        } else {
          // Remove expired query
          await database.delete('queries', query.queryKey)
        }
      }

      return validQueries
    } catch (error) {
      // Fallback to localStorage
      const validQueries = []
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index)
        if (key && key.startsWith('query-')) {
          try {
            const data = JSON.parse(localStorage.getItem(key))
            if (Date.now() - data.timestamp <= PERSISTENCE_CONFIG.MAX_AGE) {
              const queryKey = JSON.parse(key.replace('query-', ''))
              validQueries.push({
                queryKey: queryKey,
                state: { data: data.data }
              })
            } else {
              localStorage.removeItem(key)
            }
          } catch (parseError) {
            localStorage.removeItem(key)
          }
        }
      }
      return validQueries
    }
  },

  // Remove all queries
  async removeClient() {
    try {
      const database = await getDB()
      await database.clear('queries')
    } catch (error) {
      // Failed to clear IndexedDB
    }

    try {
      // Clear localStorage queries
      for (let index = localStorage.length - 1; index >= 0; index--) {
        const key = localStorage.key(index)
        if (key && key.startsWith('query-')) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      // Failed to clear localStorage
    }
  }
}
