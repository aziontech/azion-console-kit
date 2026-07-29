/* global globalThis */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Characterization tests for useSessionManager.closeTab — NEIGHBOR-ON-CLOSE.
 *
 * SEAM (task 5.2): closing the active Dashboard/panel tab activates a neighbor.
 * The refactor will change the signature to closeTab(panelId, nextActiveId?)
 * and pick the neighbor from `combinedTabOrder`. These tests PIN the CURRENT
 * behavior so the refactor is a deliberate, visible change.
 *
 * CURRENT behavior (what closeTab does today):
 *   - openTabs holds [EVENTS_TAB(id=null), ...dashboardTabs]. Additional Events
 *     tabs are NOT in this array (they live in useEventsTabs.eventsTabs).
 *   - On closing the ACTIVE tab, closeTab activates openTabs[max(0, idx-1)] —
 *     the tab immediately to its LEFT within `openTabs`, falling back to null
 *     (pinned Events tab) when idx-1 resolves to the pinned tab.
 *   - The Events tab (id=null) is non-closable: closeTab(null) is a no-op.
 *   - Closing a NON-active tab leaves activeTabId untouched.
 *
 * Overlap avoidance:
 *   - useSessionManager.tabLimit.test.js pins the limit path + removeEventsTabFromActive.
 *   - useEventsTabs.prop.test.js pins neighbor-on-close for closeEventsTab (the
 *     separate eventsTabs array). It does NOT touch useSessionManager.closeTab.
 *   These tests add ONLY the un-pinned closeTab neighbor contract.
 */

vi.mock('@/services/panels-service', () => ({
  loadPanels: vi.fn(() => []),
  loadPanelsWithMeta: vi.fn(() => ({
    panels: [],
    localStorageAvailable: true,
    discardedCount: 0
  })),
  savePanel: vi.fn(),
  updatePanel: vi.fn(),
  deletePanel: vi.fn(),
  encodeShareState: vi.fn((state) => btoa(encodeURIComponent(JSON.stringify(state)))),
  decodeShareState: vi.fn((encoded) => {
    try {
      return JSON.parse(decodeURIComponent(atob(encoded)))
    } catch {
      return null
    }
  }),
  filterValidCharts: vi.fn((charts) => charts)
}))

vi.mock('@/modules/real-time-metrics/constants/reports', () => ({
  default: []
}))

import { useSessionManager } from '../useSessionManager.js'
import { resolveTabNeighbor } from '../utils/resolveTabNeighbor.js'
import { loadPanelsWithMeta } from '@/services/panels-service'

function makeRouterFixture() {
  const route = { name: 'real-time-events', params: {}, query: {} }
  const router = { replace: vi.fn() }
  const toast = { add: vi.fn() }
  return { route, router, toast }
}

function makePanel(id) {
  return {
    id,
    label: `Panel ${id}`,
    icon: 'pi pi-star',
    type: 'custom',
    charts: [{ reportId: 'r1' }],
    eventsConfig: null
  }
}

function createManager(panels) {
  loadPanelsWithMeta.mockReturnValue({
    panels,
    localStorageAvailable: true,
    discardedCount: 0
  })
  const { route, router, toast } = makeRouterFixture()
  const manager = useSessionManager({
    route,
    router,
    toast,
    canOpenNewTab: () => true
  })
  manager.initializePanels()
  return { manager, toast, router }
}

describe('useSessionManager.closeTab — neighbor-on-close (characterization)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.localStorage.clear()
  })

  afterEach(() => {
    globalThis.localStorage.clear()
  })

  it('closing the active LAST dashboard tab activates the tab immediately to its left', () => {
    const { manager } = createManager([makePanel('a'), makePanel('b'), makePanel('c')])
    const { openTab, closeTab, activeTabId, openTabs } = manager

    openTab('a')
    openTab('b')
    openTab('c')
    // openTabs === [EVENTS(null), a, b, c]; active is 'c' (last opened)
    expect(activeTabId.value).toBe('c')
    expect(openTabs.value.map((tab) => tab.id)).toEqual([null, 'a', 'b', 'c'])

    closeTab('c')

    // Left neighbor of 'c' in openTabs is 'b'
    expect(activeTabId.value).toBe('b')
    expect(openTabs.value.map((tab) => tab.id)).toEqual([null, 'a', 'b'])
  })

  it('closing the active MIDDLE dashboard tab activates the left neighbor (openTabs order, not activation order)', () => {
    const { manager } = createManager([makePanel('a'), makePanel('b'), makePanel('c')])
    const { openTab, closeTab, setActiveTab, activeTabId } = manager

    openTab('a')
    openTab('b')
    openTab('c')
    // openTabs === [null, a, b, c]. Re-activate the middle tab 'b'.
    setActiveTab('b')
    expect(activeTabId.value).toBe('b')

    closeTab('b')

    // Neighbor is chosen by openTabs index (idx-1 = 'a'), NOT by insertion/activation.
    expect(activeTabId.value).toBe('a')
  })

  it('closing the active FIRST dashboard tab falls back to the pinned Events tab (null)', () => {
    const { manager } = createManager([makePanel('a'), makePanel('b')])
    const { openTab, closeTab, setActiveTab, activeTabId } = manager

    openTab('a')
    openTab('b')
    setActiveTab('a') // first dashboard tab, openTabs idx === 1
    expect(activeTabId.value).toBe('a')

    closeTab('a')

    // idx-1 === 0 === pinned Events tab (id null) → activeTabId falls back to null
    expect(activeTabId.value).toBe(null)
  })

  it('closing a NON-active dashboard tab leaves activeTabId untouched', () => {
    const { manager } = createManager([makePanel('a'), makePanel('b'), makePanel('c')])
    const { openTab, closeTab, setActiveTab, activeTabId, openTabs } = manager

    openTab('a')
    openTab('b')
    openTab('c')
    setActiveTab('c')

    closeTab('a') // 'a' is not active

    expect(activeTabId.value).toBe('c')
    expect(openTabs.value.map((tab) => tab.id)).toEqual([null, 'b', 'c'])
  })

  it('closeTab(null) is a no-op — the pinned Events tab is non-closable', () => {
    const { manager } = createManager([makePanel('a')])
    const { openTab, closeTab, activeTabId, openTabs } = manager

    openTab('a')
    activeTabId.value = null // pinned Events tab active

    closeTab(null)

    expect(activeTabId.value).toBe(null)
    expect(openTabs.value.map((tab) => tab.id)).toEqual([null, 'a'])
  })

  it('closing an unknown tab id does nothing', () => {
    const { manager } = createManager([makePanel('a')])
    const { openTab, closeTab, activeTabId, openTabs } = manager

    openTab('a')
    expect(activeTabId.value).toBe('a')

    closeTab('does-not-exist')

    expect(activeTabId.value).toBe('a')
    expect(openTabs.value.map((tab) => tab.id)).toEqual([null, 'a'])
  })

  it('FIXED C4: with an additional Events tab open BEFORE dashboard tabs, closeTab activates the VISUALLY-adjacent tab (the Events tab), resolved from the combined tab order', () => {
    // The tab bar renders the combined order
    //   [Events(pinned,null), ...eventsTabs, ...dashboardTabs]
    // while openTabs only holds [EVENTS(null), ...dashboardTabs]. The neighbor
    // is now resolved from the COMBINED order and passed to closeTab as the
    // second argument (closeTab(panelId, nextActiveId?)), so the additional
    // Events tab sitting to the left of 'a' in the visual bar is picked.
    const { manager } = createManager([makePanel('a')])
    const { openTab, closeTab, setActiveTab, activeTabId, openTabs } = manager

    openTab('a')
    setActiveTab('a') // first (and only) dashboard tab, openTabs idx === 1

    // Combined visual order: pinned Events, one additional Events tab, then 'a'.
    const combinedTabOrder = [{ id: null }, { id: 'events:1' }, { id: 'a' }]
    const nextActiveId = resolveTabNeighbor(combinedTabOrder, 'a')
    // The visually-adjacent tab is the additional Events tab, not the pinned one.
    expect(nextActiveId).toBe('events:1')

    closeTab('a', nextActiveId)

    // NEW correct behavior (task 5.2 / req 2.2): active tab becomes the
    // visually-adjacent additional Events tab, not the pinned Events tab (null).
    expect(activeTabId.value).toBe('events:1')
    expect(openTabs.value.map((tab) => tab.id)).toEqual([null])
  })
})
