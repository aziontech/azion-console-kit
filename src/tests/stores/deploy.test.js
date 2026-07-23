// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDeploy } from '@/stores/deploy'

/**
 * deploy store — feeds the deployment progress screen (elapsed time is
 * computed from startTime, so the clock stamp is the contract).
 */
beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-22T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('deploy tracking', () => {
  it('stamps startTime with the current clock when a deploy begins', () => {
    const store = useDeploy()

    store.addApplicationName('my-app')
    store.addStartTime()

    expect(store.getApplicationName).toBe('my-app')
    expect(store.getStartTime).toBe(new Date('2026-07-22T12:00:00Z').getTime())
  })

  it('clears both fields when the deploy finishes', () => {
    const store = useDeploy()
    store.addApplicationName('my-app')
    store.addStartTime()

    store.removeApplicationName()
    store.removeStartTime()

    expect(store.getApplicationName).toBe('')
    expect(store.getStartTime).toBeNull()
  })
})
