const STORAGE_KEY = 'so:awaiting-active'

const safeSessionStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

export const markAwaitingActiveServiceOrder = () => {
  const storage = safeSessionStorage()
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, '1')
  } catch {
    return
  }
}

export const clearAwaitingActiveServiceOrder = () => {
  const storage = safeSessionStorage()
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    return
  }
}

export const isAwaitingActiveServiceOrder = () => {
  const storage = safeSessionStorage()
  if (!storage) return false
  try {
    return storage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
