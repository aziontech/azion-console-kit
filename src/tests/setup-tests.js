import { createPinia } from 'pinia'
import { setActivePinia } from 'pinia'
import { vi, beforeEach, afterEach } from 'vitest'

export function setupGlobalPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
}

beforeEach(() => {
  setupGlobalPinia()
})

afterEach(() => {
  vi.restoreAllMocks()
})