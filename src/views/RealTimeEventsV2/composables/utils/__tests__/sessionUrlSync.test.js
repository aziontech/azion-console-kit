import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { createSessionUrlSync } from '../sessionUrlSync.js'

function makeFixture(activeId = null, query = {}) {
  const route = { name: 'real-time-events', params: { seg: 1 }, query }
  const router = { replace: vi.fn() }
  const activeTabId = ref(activeId)
  const sync = createSessionUrlSync({ route, router, activeTabId })
  return { route, router, activeTabId, sync }
}

describe('createSessionUrlSync', () => {
  it('syncUrlWithPanel sets the panel query param when a tab is active', () => {
    const { router, sync } = makeFixture('panel-a', { keep: '1' })
    sync.syncUrlWithPanel()
    expect(router.replace).toHaveBeenCalledWith({
      name: 'real-time-events',
      params: { seg: 1 },
      query: { keep: '1', panel: 'panel-a' }
    })
  })

  it('syncUrlWithPanel removes the panel query param when no tab is active', () => {
    const { router, sync } = makeFixture(null, { panel: 'old', keep: '1' })
    sync.syncUrlWithPanel()
    expect(router.replace).toHaveBeenCalledWith({
      name: 'real-time-events',
      params: { seg: 1 },
      query: { keep: '1' }
    })
  })

  it('removeQueryParam strips only the named param', () => {
    const { router, sync } = makeFixture(null, { shareState: 'abc', keep: '1' })
    sync.removeQueryParam('shareState')
    expect(router.replace).toHaveBeenCalledWith({
      name: 'real-time-events',
      params: { seg: 1 },
      query: { keep: '1' }
    })
  })
})
