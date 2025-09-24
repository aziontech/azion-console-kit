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
      return encrypted ? decode(value) : value
    } catch {
      const raw = localStorage.getItem(key)
      if (raw == null) return null
      return encrypted ? decode(raw) : JSON.parse(raw)
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
  }
}
