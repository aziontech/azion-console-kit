import { createPinia } from 'pinia'
import { setActivePinia } from 'pinia'
import { vi, beforeEach, afterEach } from 'vitest'

// jsdom 22 + Node 22+ fail to expose a working `localStorage`/`sessionStorage`
// (Node's native getter shadows the global and jsdom's window getter returns
// undefined in this combo). Install a deterministic in-memory polyfill so
// helpers that use bare `localStorage`/`sessionStorage` work in tests.
function createMemoryStorage() {
  const store = new Map()
  return {
    get length() {
      return store.size
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null
    },
    getItem(key) {
      return store.has(String(key)) ? store.get(String(key)) : null
    },
    setItem(key, value) {
      store.set(String(key), String(value))
    },
    removeItem(key) {
      store.delete(String(key))
    },
    clear() {
      store.clear()
    }
  }
}

const localStoragePolyfill = createMemoryStorage()
const sessionStoragePolyfill = createMemoryStorage()

const globalRef = Function('return this')()

for (const target of [globalRef, typeof window !== 'undefined' ? window : null]) {
  if (!target) continue
  Object.defineProperty(target, 'localStorage', {
    configurable: true,
    get: () => localStoragePolyfill
  })
  Object.defineProperty(target, 'sessionStorage', {
    configurable: true,
    get: () => sessionStoragePolyfill
  })
}

function disableBroadcastChannelForTests() {
  Function('return this')().BroadcastChannel = undefined
}

disableBroadcastChannelForTests()

export function setupGlobalPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
}

beforeEach(() => {
  disableBroadcastChannelForTests()
  setupGlobalPinia()
})

afterEach(() => {
  vi.restoreAllMocks()
})
