import { createPinia } from 'pinia'
import { setActivePinia } from 'pinia'
import { vi, beforeEach, afterEach } from 'vitest'

function disableBroadcastChannelForTests() {
  Function('return this')().BroadcastChannel = undefined
}

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
