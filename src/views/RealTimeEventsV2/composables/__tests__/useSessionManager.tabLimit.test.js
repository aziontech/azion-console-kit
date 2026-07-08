/* global globalThis */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Unit tests for the shared tab-limit path in useSessionManager.
 *
 * Task 17.3 — Tests:
 * 1. When canOpenNewTab is injected and returns false, openTab shows the warn
 *    toast with the MAX_TOTAL_TABS message and does NOT open the tab.
 * 2. When canOpenNewTab is injected and returns true, openTab opens the tab normally.
 * 3. When canOpenNewTab is NOT injected (null), openTab falls back to the old
 *    MAX_OPEN_TABS = 5 limit.
 * 4. removeEventsTabFromActive sets activeTabId to null when the closed tab was active.
 * 5. removeEventsTabFromActive does nothing when the closed tab was not active.
 */

// ---------------------------------------------------------------------------
// Mock service imports that useSessionManager depends on
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Import composable and constants (after mocks are registered)
// ---------------------------------------------------------------------------

import { useSessionManager, MAX_OPEN_TABS } from '../useSessionManager.js'
import { MAX_TOTAL_TABS } from '../useTabLimit.js'
import { loadPanelsWithMeta } from '@/services/panels-service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal route/router/toast triple for useSessionManager.
 */
function makeRouterFixture() {
  const route = {
    name: 'real-time-events',
    params: {},
    query: {}
  }
  const router = {
    replace: vi.fn()
  }
  const toast = {
    add: vi.fn()
  }
  return { route, router, toast }
}

/**
 * Build a panel object that useSessionManager can open as a tab.
 */
function makePanel(id = 'panel-1') {
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
 * Create a useSessionManager instance with the given panels pre-loaded.
 * Panels are injected via loadPanelsWithMeta mock so initializePanels() works.
 */
function createManager(panels, opts = {}) {
  loadPanelsWithMeta.mockReturnValue({
    panels,
    localStorageAvailable: true,
    discardedCount: 0
  })

  const { route, router, toast } = makeRouterFixture()
  const manager = useSessionManager({ route, router, toast, ...opts })
  manager.initializePanels()

  return { manager, toast, router }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSessionManager — tab-limit path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.localStorage.clear()
  })

  afterEach(() => {
    globalThis.localStorage.clear()
  })

  // ── Test 1: canOpenNewTab injected, returns false ─────────────────────────

  describe('when canOpenNewTab is injected and returns false', () => {
    it('shows the warn toast with MAX_TOTAL_TABS message and does NOT open the tab', () => {
      const panel = makePanel('panel-a')
      const canOpenNewTab = vi.fn(() => false)

      const { manager, toast } = createManager([panel], { canOpenNewTab })
      const { openTab, openTabs } = manager

      const tabsBefore = openTabs.value.length

      openTab('panel-a')

      // Tab count must not have increased
      expect(openTabs.value.length).toBe(tabsBefore)

      // Toast must have been called with the MAX_TOTAL_TABS message
      expect(toast.add).toHaveBeenCalledOnce()
      const toastCall = toast.add.mock.calls[0][0]
      expect(toastCall.severity).toBe('warn')
      expect(toastCall.summary).toBe(`Tab limit reached (${MAX_TOTAL_TABS})`)
    })
  })

  // ── Test 2: canOpenNewTab injected, returns true ──────────────────────────

  describe('when canOpenNewTab is injected and returns true', () => {
    it('opens the tab normally', () => {
      const panel = makePanel('panel-b')
      const canOpenNewTab = vi.fn(() => true)

      const { manager, toast } = createManager([panel], { canOpenNewTab })
      const { openTab, openTabs, activeTabId } = manager

      openTab('panel-b')

      // Tab should now be open
      // eslint-disable-next-line id-length
      expect(openTabs.value.some((t) => t.id === 'panel-b')).toBe(true)
      // Active tab should be set
      expect(activeTabId.value).toBe('panel-b')
      // No limit-reached warn toast
      const warnToasts = toast.add.mock.calls.filter(
        ([arg]) => arg.severity === 'warn' && arg.summary?.includes('Tab limit')
      )
      expect(warnToasts).toHaveLength(0)
    })
  })

  // ── Test 3: canOpenNewTab NOT injected — falls back to MAX_OPEN_TABS = 5 ──

  describe('when canOpenNewTab is NOT injected (null)', () => {
    it('falls back to the old MAX_OPEN_TABS = 5 limit', () => {
      // Create 6 panels so we can try to open more than 5
      // eslint-disable-next-line id-length
      const panels = Array.from({ length: 6 }, (_, i) => makePanel(`panel-${i}`))

      // No canOpenNewTab injected — uses legacy path
      const { manager, toast } = createManager(panels)
      const { openTab, openTabs } = manager

      // Open 5 tabs (the old limit)
      // eslint-disable-next-line id-length
      for (let i = 0; i < 5; i++) {
        openTab(`panel-${i}`)
      }

      // At this point we have 5 extra tabs + 1 pinned = 6 total
      // eslint-disable-next-line id-length
      const extraCount = openTabs.value.filter((t) => t.id !== null).length
      expect(extraCount).toBe(5)

      // Attempting to open a 6th extra tab should be blocked by MAX_OPEN_TABS
      toast.add.mockClear()
      openTab('panel-5')

      // Tab should NOT have been added
      // eslint-disable-next-line id-length
      const extraCountAfter = openTabs.value.filter((t) => t.id !== null).length
      expect(extraCountAfter).toBe(5)

      // Toast should use the old MAX_OPEN_TABS message
      expect(toast.add).toHaveBeenCalledOnce()
      const toastCall = toast.add.mock.calls[0][0]
      expect(toastCall.severity).toBe('warn')
      expect(toastCall.summary).toBe(`Tab limit reached (${MAX_OPEN_TABS})`)
      expect(MAX_OPEN_TABS).toBe(5)
    })
  })

  // ── Test 4: removeEventsTabFromActive — active tab ────────────────────────

  describe('removeEventsTabFromActive', () => {
    it('sets activeTabId to null when the closed tab was active', () => {
      const panel = makePanel('panel-c')
      const canOpenNewTab = vi.fn(() => true)

      const { manager } = createManager([panel], { canOpenNewTab })
      const { openTab, activeTabId, removeEventsTabFromActive } = manager

      // Open and activate the tab
      openTab('panel-c')
      expect(activeTabId.value).toBe('panel-c')

      // Now close it via removeEventsTabFromActive
      removeEventsTabFromActive('panel-c')

      // activeTabId should fall back to null (pinned Events tab)
      expect(activeTabId.value).toBe(null)
    })

    // ── Test 5: removeEventsTabFromActive — non-active tab ──────────────────

    it('does nothing when the closed tab was not active', () => {
      const panelC = makePanel('panel-c')
      const panelD = makePanel('panel-d')
      const canOpenNewTab = vi.fn(() => true)

      const { manager } = createManager([panelC, panelD], { canOpenNewTab })
      const { openTab, activeTabId, removeEventsTabFromActive } = manager

      // Open both tabs; panel-c is active
      openTab('panel-c')
      openTab('panel-d')
      // Activate panel-c explicitly
      activeTabId.value = 'panel-c'

      // Try to remove panel-d (which is NOT active)
      removeEventsTabFromActive('panel-d')

      // activeTabId should remain panel-c
      expect(activeTabId.value).toBe('panel-c')
    })
  })
})
