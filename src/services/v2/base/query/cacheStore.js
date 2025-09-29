import { get, set, del, keys, createStore } from 'idb-keyval'

function encode(data) {
  return btoa(JSON.stringify(data))
}
function decode(value) {
  return JSON.parse(atob(value))
}

const DB_NAME = 'AZION_CACHE'
const STORE_NAME = 'AZION_STORE'

const customStore = createStore(DB_NAME, STORE_NAME)

export const cacheStore = {
  async get(key, encrypted = false) {
    try {
      const value = await get(key, customStore)
      if (value == null) return null
      const decoded = encrypted ? decode(value) : value

      if (decoded && decoded.timestamp && decoded.gcTime) {
        const isExpired = Date.now() - decoded.timestamp > decoded.gcTime
        if (isExpired) {
          await this.remove(key)
          return null
        }
      }

      return decoded
    } catch {
      const raw = localStorage.getItem(key)
      if (raw == null) return null
      const decoded = encrypted ? decode(raw) : JSON.parse(raw)

      if (decoded && decoded.timestamp && decoded.gcTime) {
        const isExpired = Date.now() - decoded.timestamp > decoded.gcTime
        if (isExpired) {
          await this.remove(key)
          return null
        }
      }

      return decoded
    }
  },

  async set(key, value, encrypted = false) {
    const toSave = encrypted ? encode(value) : value
    try {
      await set(key, toSave, customStore)
    } catch {
      localStorage.setItem(key, JSON.stringify(toSave))
    }
  },

  async remove(key) {
    try {
      await del(key, customStore)
    } catch {
      localStorage.removeItem(key)
    }
  },

  async clearAllByPrefix(prefix) {
    try {
      const all = await keys(customStore)
      await Promise.all(
        all.filter((key) => String(key).startsWith(prefix)).map((key) => del(key, customStore))
      )
    } catch {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(prefix)) localStorage.removeItem(key)
      })
    }
  },

  async clearExpired() {
    try {
      const all = await keys(customStore)
      const expiredKeys = []

      for (const key of all) {
        try {
          const value = await get(key, customStore)
          if (value && value.timestamp && value.gcTime) {
            const isExpired = Date.now() - value.timestamp > value.gcTime
            if (isExpired) {
              expiredKeys.push(key)
            }
          }
        } catch (err) {
          expiredKeys.push(key)
        }
      }

      await Promise.all(expiredKeys.map((key) => del(key, customStore)))
      return expiredKeys.length
    } catch {
      const expiredKeys = []
      Object.keys(localStorage).forEach((key) => {
        try {
          const raw = localStorage.getItem(key)
          if (raw) {
            const value = JSON.parse(raw)
            if (value && value.timestamp && value.gcTime) {
              const isExpired = Date.now() - value.timestamp > value.gcTime
              if (isExpired) {
                expiredKeys.push(key)
              }
            }
          }
        } catch (err) {
          expiredKeys.push(key)
        }
      })

      expiredKeys.forEach((key) => localStorage.removeItem(key))
      return expiredKeys.length
    }
  }
}
