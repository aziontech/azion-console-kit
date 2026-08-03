import { cleanup } from '@testing-library/vue'
import { afterEach, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  cleanup()
})
