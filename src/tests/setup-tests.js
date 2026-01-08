import { createPinia } from 'pinia'
import { setActivePinia } from 'pinia'
import { vi, beforeEach, afterEach } from 'vitest'

export function setupGlobalPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
}

class MockBroadcastChannel {
  constructor(name) {
    this.name = name
    this.onmessage = null
    this.onmessageerror = null
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true
  }
}

beforeEach(() => {
  vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)
  setupGlobalPinia()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
