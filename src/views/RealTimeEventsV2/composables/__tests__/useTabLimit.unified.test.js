/* global globalThis */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computed, ref } from 'vue'

/**
 * Regression guard for Bug C1 (Task 5.1 — req 2.1, 2.5):
 *
 * Before the fix, two tab-limit systems were active simultaneously:
 *   - useSessionManager admitted/restored Dashboard tabs under the legacy
 *     per-type MAX_OPEN_TABS = 5 (ignoring Events tabs), and
 *   - useEventsTabs / the Share_State watcher used MAX_TOTAL_TABS = 6.
 * Restoration could therefore exceed the intended ceiling (e.g. 5 Dashboard
 * tabs + 5 Events tabs = 10 while MAX_TOTAL_TABS = 6).
 *
 * These tests wire the SAME single ceiling-aware source of truth (useTabLimit)
 * into both composables exactly as TabsView does, and assert one unified
 * ceiling for admission AND restoration across all tab kinds.
 */

vi.mock('@/services/panels-service', () => ({
  loadPanels: vi.fn(() => []),
  loadPanelsWithMeta: vi.fn(() => ({ panels: [], localStorageAvailable: true, discardedCount: 0 })),
  savePanel: vi.fn(),
  updatePanel: vi.fn(),
  deletePanel: vi.fn(),
  encodeShareState: vi.fn((state) => btoa(encodeURIComponent(JSON.stringify(state)))),
  decodeShareState: vi.fn((encoded) => JSON.parse(decodeURIComponent(atob(encoded)))),
  filterValidCharts: vi.fn((charts) => charts)
}))

vi.mock('@/modules/real-time-metrics/constants/reports', () => ({ default: [] }))

import { useTabLimit, MAX_TOTAL_TABS } from '../useTabLimit.js'
import { useEventsTabs } from '../useEventsTabs.js'
import { useSessionManager } from '../useSessionManager.js'
import { loadPanelsWithMeta } from '@/services/panels-service'

const EVENTS_TABS_STORAGE_KEY = 'rte:open-events-tabs'
const DASHBOARD_TABS_STORAGE_KEY = 'rte:open-tabs'

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

/**
 * Wire the three composables through ONE useTabLimit instance, mirroring
 * TabsView. Returns the pieces needed to exercise the unified ceiling.
 */
function wireTabs(panels = []) {
  loadPanelsWithMeta.mockReturnValue({ panels, localStorageAvailable: true, discardedCount: 0 })

  const activeTabId = ref(null)
  const toast = { add: vi.fn() }
  const route = { name: 'rte', params: {}, query: {} }
  const router = { replace: vi.fn() }

  // Forward-referenced lazily by the computed (no init-order trap).
  let eventsTabsRef
  let dashboardTabsRef

  const { canOpenNewTab, totalTabCount, capForRestore } = useTabLimit({
    openTabs: computed(() => [
      { id: null },
      ...eventsTabsRef.value,
      ...dashboardTabsRef.value.filter((tab) => tab.id !== null)
    ])
  })

  const session = useSessionManager({
    route,
    router,
    toast,
    canOpenNewTab,
    capForRestore,
    reservedTabCount: () => eventsTabsRef.value.length
  })
  dashboardTabsRef = session.openTabs

  const events = useEventsTabs({
    toast,
    totalTabCount,
    canOpenNewTab,
    capForRestore,
    activeTabId
  })
  eventsTabsRef = events.eventsTabs

  return { session, events, toast, activeTabId, totalTabCount, canOpenNewTab }
}

describe('unified tab limit (Bug C1 — single ceiling-aware source of truth)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.localStorage.clear()
  })

  afterEach(() => {
    globalThis.localStorage.clear()
  })

  it('admission across Dashboard + Events tabs shares ONE ceiling (MAX_TOTAL_TABS)', () => {
    const panels = Array.from({ length: 8 }, (_unused, index) => makePanel(`panel-${index}`))
    const { session, events } = wireTabs(panels)
    session.initializePanels()

    // Open 3 Dashboard tabs and 2 Events tabs → 1 pinned + 3 + 2 = 6 = MAX.
    session.openTab('panel-0')
    session.openTab('panel-1')
    session.openTab('panel-2')
    events.openEventsTab({ dataset: 'httpRequests' })
    events.openEventsTab({ dataset: 'httpRequests' })

    expect(events.eventsTabs.value).toHaveLength(2)
    const dashboardCount = session.openTabs.value.filter((tab) => tab.id !== null).length
    expect(dashboardCount).toBe(3)

    // Ceiling hit by the COMBINED count — a Dashboard admission is now blocked
    // by the same ceiling that counts Events tabs (previously it used the
    // separate MAX_OPEN_TABS = 5 and would have allowed it).
    session.openTab('panel-3')
    expect(session.openTabs.value.filter((tab) => tab.id !== null).length).toBe(3)

    // And a new Events tab is equally blocked.
    events.openEventsTab({ dataset: 'httpRequests' })
    expect(events.eventsTabs.value).toHaveLength(2)
  })

  it('restoration honors the SAME ceiling across both kinds (no dual-system overflow)', () => {
    // Persist 5 Events tabs and 5 Dashboard tabs — the pre-fix dual-system
    // would restore 5 + 5 = 10 tabs. The unified ceiling caps the total.
    const persistedEvents = Array.from({ length: 5 }, (_unused, index) => ({
      id: `events:e${index}`,
      label: `Events (${index + 2})`,
      dataset: 'httpRequests'
    }))
    globalThis.localStorage.setItem(EVENTS_TABS_STORAGE_KEY, JSON.stringify(persistedEvents))

    const panels = Array.from({ length: 5 }, (_unused, index) => makePanel(`panel-${index}`))
    globalThis.localStorage.setItem(
      DASHBOARD_TABS_STORAGE_KEY,
      JSON.stringify(panels.map((panel) => panel.id))
    )

    const { session, events } = wireTabs(panels)

    // Mirror TabsView mount order: Events tabs restore first, Dashboard second.
    events.restoreEventsTabs()
    session.initializePanels() // → restoreTabs()

    const eventsCount = events.eventsTabs.value.length
    const dashboardCount = session.openTabs.value.filter((tab) => tab.id !== null).length

    // Events restore reserves the pinned slot → capped at MAX_TOTAL_TABS - 1.
    expect(eventsCount).toBe(MAX_TOTAL_TABS - 1)
    // Dashboard restore reserves pinned + already-restored Events tabs → 0 room.
    expect(dashboardCount).toBe(0)

    // Combined total never exceeds the single ceiling.
    expect(1 + eventsCount + dashboardCount).toBeLessThanOrEqual(MAX_TOTAL_TABS)
  })

  it('with fewer Events tabs, Dashboard restore fills the remaining slots up to the ceiling', () => {
    const persistedEvents = [{ id: 'events:e0', label: 'Events (2)', dataset: 'httpRequests' }]
    globalThis.localStorage.setItem(EVENTS_TABS_STORAGE_KEY, JSON.stringify(persistedEvents))

    const panels = Array.from({ length: 8 }, (_unused, index) => makePanel(`panel-${index}`))
    globalThis.localStorage.setItem(
      DASHBOARD_TABS_STORAGE_KEY,
      JSON.stringify(panels.map((panel) => panel.id))
    )

    const { session, events } = wireTabs(panels)
    events.restoreEventsTabs()
    session.initializePanels()

    const eventsCount = events.eventsTabs.value.length
    const dashboardCount = session.openTabs.value.filter((tab) => tab.id !== null).length

    expect(eventsCount).toBe(1)
    // Reserved = pinned(1) + events(1) = 2 → 4 Dashboard slots remain.
    expect(dashboardCount).toBe(MAX_TOTAL_TABS - 2)
    expect(1 + eventsCount + dashboardCount).toBe(MAX_TOTAL_TABS)
  })
})
