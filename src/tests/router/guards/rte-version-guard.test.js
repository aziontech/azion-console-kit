// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { realTimeEventsVersionGuard } from '@/router/hooks/guards/realTimeEventsVersionGuard'
import { useRealTimeEventsPreferenceStore } from '@/stores/real-time-events-preference'

/**
 * realTimeEventsVersionGuard — keeps the user's RTE v1/v2 preference sticky
 * across navigations (real Pinia store, no mocks).
 */
beforeEach(() => {
  setActivePinia(createPinia())
})

describe('explicit version choices', () => {
  it('the v2 tab on the v1 route redirects to the v2 route and persists the choice', () => {
    const result = realTimeEventsVersionGuard({
      to: { name: 'real-time-events', params: { tab: 'v2' }, query: { search: '1' } }
    })

    expect(result).toEqual({ name: 'real-time-events-v2', query: { search: '1' } })
    expect(useRealTimeEventsPreferenceStore().viewVersion).toBe('v2')
  })

  it('landing on the v2 route directly records the v2 preference and proceeds', () => {
    const result = realTimeEventsVersionGuard({
      to: { name: 'real-time-events-v2', params: {}, query: {} }
    })

    expect(result).toBeUndefined()
    expect(useRealTimeEventsPreferenceStore().viewVersion).toBe('v2')
  })
})

describe('preference stickiness on the v1 route', () => {
  it('bounces a v2-preferring user from the v1 route to v2, keeping the query', () => {
    useRealTimeEventsPreferenceStore().setVersion('v2')

    const result = realTimeEventsVersionGuard({
      to: { name: 'real-time-events', params: {}, query: { range: '1h' } }
    })

    expect(result).toEqual({ name: 'real-time-events-v2', query: { range: '1h' } })
  })

  it('records v1 and proceeds when there is no v2 preference', () => {
    const result = realTimeEventsVersionGuard({
      to: { name: 'real-time-events', params: {}, query: {} }
    })

    expect(result).toBeUndefined()
    expect(useRealTimeEventsPreferenceStore().viewVersion).toBe('v1')
  })

  it('ignores unrelated routes entirely', () => {
    expect(
      realTimeEventsVersionGuard({ to: { name: 'home', params: {}, query: {} } })
    ).toBeUndefined()
  })
})
