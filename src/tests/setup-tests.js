/* global globalThis */
import { createPinia } from 'pinia'
import { setActivePinia } from 'pinia'
import { vi, beforeEach, afterEach } from 'vitest'

function disableBroadcastChannelForTests() {
  Function('return this')().BroadcastChannel = undefined
}

/**
 * jsdom does not implement ResizeObserver, so components that instantiate one
 * on mount (e.g. log-field-badges.vue) throw `ResizeObserver is not defined`.
 * Install a no-op stub on every global the test may reference.
 */
function installResizeObserverPolyfill() {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  const targets = []
  if (typeof globalThis !== 'undefined') targets.push(globalThis)
  if (typeof window !== 'undefined' && window !== globalThis) targets.push(window)

  for (const target of targets) {
    if (typeof target.ResizeObserver === 'undefined') {
      target.ResizeObserver = ResizeObserverStub
    }
  }
}

/**
 * Provide a localStorage / sessionStorage polyfill for the test environment.
 *
 * Node 22+ ships with a built-in (experimental) `globalThis.localStorage`
 * getter that returns `undefined` unless `--localstorage-file` is provided,
 * shadowing the jsdom-provided `window.localStorage`. The vitest test setup
 * uses the `jsdom` environment, so `window.localStorage` IS available — but
 * any test that references the bare global `localStorage` (without going
 * through `window`) hits the Node-level getter first and crashes with
 * `Cannot read properties of undefined (reading 'clear')`.
 *
 * Strategy:
 * 1. Prefer the jsdom-backed `window.localStorage` so existing tests that
 *    spy on `Storage.prototype.{getItem,setItem,removeItem}` continue to
 *    work (jsdom's localStorage is a real `Storage` instance).
 * 2. If `window.localStorage` is not available (e.g. when the environment is
 *    not jsdom), fall back to a Map-backed in-memory implementation.
 */
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

function isUsableStorage(value) {
  if (value == null) return false
  return (
    typeof value.clear === 'function' &&
    typeof value.getItem === 'function' &&
    typeof value.setItem === 'function' &&
    typeof value.removeItem === 'function'
  )
}

function pickStorage(propName) {
  // Prefer the jsdom Storage instance when available so prototype-level
  // spies (vi.spyOn(Storage.prototype, 'getItem')) keep working.
  if (typeof window !== 'undefined') {
    try {
      if (isUsableStorage(window[propName])) return window[propName]
    } catch {
      /* noop */
    }
  }
  return createMemoryStorage()
}

function installStoragePolyfill(propName) {
  const storage = pickStorage(propName)
  const targets = []
  if (typeof globalThis !== 'undefined') targets.push(globalThis)
  if (typeof window !== 'undefined' && window !== globalThis) targets.push(window)

  for (const target of targets) {
    let usable = false
    try {
      usable = isUsableStorage(target[propName])
    } catch {
      usable = false
    }
    if (!usable) {
      Object.defineProperty(target, propName, {
        configurable: true,
        writable: true,
        value: storage
      })
    }
  }
}

export function setupGlobalPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
}

// Install storage polyfills once, up front, so every test sees them.
installStoragePolyfill('localStorage')
installStoragePolyfill('sessionStorage')
installResizeObserverPolyfill()

function clearStorageSafely(propName) {
  // The polyfill installed above is a plain object — not a real Storage
  // instance — so prototype-level spies cannot intercept its methods.
  // Calling .clear() directly on the global (and on `window`, which may be
  // a separate reference depending on the environment) ensures every test
  // starts from a clean state regardless of how previous tests wrote to it.
  for (const target of [
    typeof globalThis !== 'undefined' ? globalThis : null,
    typeof window !== 'undefined' && window !== globalThis ? window : null
  ]) {
    if (!target) continue
    try {
      const storage = target[propName]
      if (storage && typeof storage.clear === 'function') storage.clear()
    } catch {
      /* noop */
    }
  }
}

beforeEach(() => {
  disableBroadcastChannelForTests()
  installStoragePolyfill('localStorage')
  installStoragePolyfill('sessionStorage')
  clearStorageSafely('localStorage')
  clearStorageSafely('sessionStorage')
  setupGlobalPinia()
})

afterEach(() => {
  vi.restoreAllMocks()
  clearStorageSafely('localStorage')
  clearStorageSafely('sessionStorage')
})
