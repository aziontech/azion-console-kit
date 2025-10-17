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

const createQueryKeyJSON = (queryKey) => {
  return JSON.stringify(queryKey)
}

export const indexedDbPersister = {
  async persistQuery(queryKey, data) {
    try {
      const database = await getDB()
      const key = createQueryKeyJSON(queryKey)
      const queryData = {
        queryKey: key,
        data: data,
        timestamp: Date.now()
      }

      await database.put('queries', queryData)
    } catch (error) {
      const key = createQueryKeyJSON(queryKey)
      localStorage.setItem(
        `query-${key}`,
        JSON.stringify({
          data: data,
          timestamp: Date.now()
        })
      )
    }
  },

  async restoreQuery(queryKey) {
    try {
      const database = await getDB()
      const key = createQueryKeyJSON(queryKey)
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
        const key = createQueryKeyJSON(queryKey)
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

  async removeQuery(queryKey) {
    try {
      const database = await getDB()
      const key = createQueryKeyJSON(queryKey)
      await database.delete('queries', key)
    } catch (error) {
      throw new Error(error)
    }

    try {
      const key = createQueryKeyJSON(queryKey)
      localStorage.removeItem(`query-${key}`)
    } catch (error) {
      throw new Error(error)
    }
  },

  async persistClient(queries) {
    if (!Array.isArray(queries)) return

    for (const query of queries) {
      if (query.queryKey && query.state) {
        await this.persistQuery(query.queryKey, query.state.data)
      }
    }
  },

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
          await database.delete('queries', query.queryKey)
        }
      }

      return validQueries
    } catch (error) {
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

  async removeClient() {
    try {
      const database = await getDB()
      await database.clear('queries')
    } catch (error) {
      throw new Error(error)
    }

    try {
      for (let index = localStorage.length - 1; index >= 0; index--) {
        const key = localStorage.key(index)
        if (key && key.startsWith('query-')) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      throw new Error(error)
    }
  }
}
