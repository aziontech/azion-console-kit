import { useAccountStore } from '@/stores/account'

const GUEST_NAMESPACE = 'guest'

const isStorageAvailable = () => typeof window !== 'undefined' && Boolean(window.localStorage)

const namespaceFor = (clientId) => {
  if (clientId === null || clientId === undefined || clientId === '') return GUEST_NAMESPACE
  return String(clientId)
}

const currentNamespace = () => {
  try {
    const store = useAccountStore()
    return namespaceFor(store.account?.client_id)
  } catch {
    return GUEST_NAMESPACE
  }
}

export const buildScopedKey = (baseKey, clientId) => `client:${namespaceFor(clientId)}:${baseKey}`

export const scopedKey = (baseKey) => `client:${currentNamespace()}:${baseKey}`

export const readScoped = (baseKey) => {
  if (!isStorageAvailable()) return null
  try {
    const raw = window.localStorage.getItem(scopedKey(baseKey))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const writeScoped = (baseKey, value) => {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.setItem(scopedKey(baseKey), JSON.stringify(value))
  } catch {
    // ignore quota or serialization errors
  }
}

export const removeScoped = (baseKey) => {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.removeItem(scopedKey(baseKey))
  } catch {
    // ignore
  }
}

// Moves data from `client:guest:{baseKey}` to `client:{clientId}:{baseKey}`.
// If a value already exists for the target client_id, the existing value wins
// (the authenticated user's previous choice is more authoritative) and the
// guest entry is discarded.
export const migrateGuestTo = (baseKey, clientId) => {
  if (!isStorageAvailable() || !clientId) return
  const sourceKey = buildScopedKey(baseKey, null)
  const targetKey = buildScopedKey(baseKey, clientId)
  try {
    const guestValue = window.localStorage.getItem(sourceKey)
    if (!guestValue) return
    if (!window.localStorage.getItem(targetKey)) {
      window.localStorage.setItem(targetKey, guestValue)
    }
    window.localStorage.removeItem(sourceKey)
  } catch {
    // ignore
  }
}
