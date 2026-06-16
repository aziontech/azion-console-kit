import { createPinia } from 'pinia'
import { setActivePinia } from 'pinia'
import { vi, beforeEach, afterEach } from 'vitest'

function disableBroadcastChannelForTests() {
  Function('return this')().BroadcastChannel = undefined
}

function setupLocalStorageForTests() {
  const store = new Map()
  const localStorageMock = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    }
  }
  vi.stubGlobal('localStorage', localStorageMock)
}

export function setupGlobalPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
}

beforeEach(() => {
  disableBroadcastChannelForTests()
  setupGlobalPinia()
  setupLocalStorageForTests()
})

afterEach(() => {
  vi.restoreAllMocks()
})
