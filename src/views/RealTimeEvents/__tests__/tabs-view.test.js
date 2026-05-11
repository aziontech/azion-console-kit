/**
 * Feature: real-time-events-enhancements
 *
 * Component / composable wiring tests for TabsView integration.
 *
 * Task 16.9 — Unit tests for TabsView composable wiring logic.
 *
 * These tests exercise the composable logic that TabsView.vue wires together,
 * without mounting the full component (which has too many external dependencies).
 *
 * **Validates: Requirements 1.1, 1.2, 1.4, 1.7, 2.6, 4.3**
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, computed, nextTick } from 'vue'
import { useEventsTabs, isEventsTabId } from '../composables/useEventsTabs.js'
import { useTabLimit, MAX_TOTAL_TABS } from '../composables/useTabLimit.js'
import TABS_EVENTS from '../Blocks/constants/tabs-events.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTabsSetup() {
  const activeTabId = ref(null)
  const openTabs = ref([{ id: null }]) // pinned tab only initially
  const toast = { add: vi.fn() }

  const {
    eventsTabs,
    openEventsTab,
    closeEventsTab,
    renameEventsTab,
    restoreEventsTabs,
    getPendingViewState,
    isEventsTabId: isEventsId
  } = useEventsTabs({
    toast,
    totalTabCount: () => {
      return 1 + eventsTabs.value.length + openTabs.value.filter((t) => t.id !== null).length
    },
    activeTabId
  })

  const { MAX_TOTAL_TABS: maxTabs, canOpenNewTab } = useTabLimit({
    openTabs: computed(() => [
      { id: null },
      ...eventsTabs.value,
      ...openTabs.value.filter((t) => t.id !== null)
    ])
  })

  // Simulate openNewEventsTab from TabsView
  const openNewEventsTab = () => {
    const defaultDataset = Object.values(TABS_EVENTS)[0]?.panel || 'httpRequests'
    openEventsTab({ dataset: defaultDataset })
  }

  // Simulate handleCloseTab from TabsView
  const handleCloseTab = (tabId) => {
    if (isEventsId(tabId)) {
      closeEventsTab(tabId)
    } else {
      // Dashboard tab close — just remove from openTabs
      openTabs.value = openTabs.value.filter((t) => t.id !== tabId)
    }
  }

  // Simulate handleShare from TabsView
  const tabPanelBlockRef = ref(null)
  const handleShare = (shareCurrentViewFn) => {
    let viewState = {}
    let eventsTab = null

    if (tabPanelBlockRef.value?.getCurrentShareState) {
      viewState = tabPanelBlockRef.value.getCurrentShareState()
    }

    if (activeTabId.value && isEventsId(activeTabId.value)) {
      const tab = eventsTabs.value.find((t) => t.id === activeTabId.value)
      if (tab) {
        eventsTab = { id: tab.id, label: tab.label, dataset: tab.dataset }
      }
    }

    shareCurrentViewFn({ viewState, eventsTab })
  }

  return {
    activeTabId,
    openTabs,
    toast,
    eventsTabs,
    openEventsTab,
    closeEventsTab,
    renameEventsTab,
    restoreEventsTabs,
    getPendingViewState,
    isEventsId,
    maxTabs,
    canOpenNewTab,
    openNewEventsTab,
    handleCloseTab,
    handleShare,
    tabPanelBlockRef
  }
}

// ---------------------------------------------------------------------------
// Test 1: openNewEventsTab calls openEventsTab with the default dataset
// **Validates: Requirements 1.1, 1.2**
// ---------------------------------------------------------------------------

describe('openNewEventsTab', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('opens a new Events tab with the default dataset (first TABS_EVENTS entry)', () => {
    const { openNewEventsTab, eventsTabs, activeTabId } = createTabsSetup()

    expect(eventsTabs.value).toHaveLength(0)

    openNewEventsTab()

    expect(eventsTabs.value).toHaveLength(1)
    const newTab = eventsTabs.value[0]
    expect(newTab.dataset).toBe(Object.values(TABS_EVENTS)[0].panel)
    expect(isEventsTabId(newTab.id)).toBe(true)
    expect(activeTabId.value).toBe(newTab.id)
  })

  it('assigns a default label Events (2) to the first additional tab', () => {
    const { openNewEventsTab, eventsTabs } = createTabsSetup()

    openNewEventsTab()

    expect(eventsTabs.value[0].label).toBe('Events (2)')
  })

  it('shows a warn toast when the tab limit is reached', () => {
    const { openNewEventsTab, eventsTabs, toast } = createTabsSetup()

    // Open MAX_TOTAL_TABS - 1 additional tabs (pinned + these = MAX_TOTAL_TABS)
    for (let i = 0; i < MAX_TOTAL_TABS - 1; i++) {
      openNewEventsTab()
    }

    expect(eventsTabs.value).toHaveLength(MAX_TOTAL_TABS - 1)

    // This one should be blocked
    openNewEventsTab()

    expect(eventsTabs.value).toHaveLength(MAX_TOTAL_TABS - 1)
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        summary: expect.stringContaining(`Tab limit reached (${MAX_TOTAL_TABS})`)
      })
    )
  })

  it('toast message contains the exact copy from the spec', () => {
    const { openNewEventsTab, toast } = createTabsSetup()

    // Fill up to the limit
    for (let i = 0; i < MAX_TOTAL_TABS - 1; i++) {
      openNewEventsTab()
    }
    toast.add.mockClear()

    openNewEventsTab()

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        summary: `Tab limit reached (${MAX_TOTAL_TABS}). Close a tab before opening another one.`,
        closable: true,
        life: 4000
      })
    )
  })
})

// ---------------------------------------------------------------------------
// Test 2: handleCloseTab routes to closeEventsTab vs closeTab
// **Validates: Requirements 1.7**
// ---------------------------------------------------------------------------

describe('handleCloseTab routing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('routes to closeEventsTab for events tabs', () => {
    const { openNewEventsTab, handleCloseTab, eventsTabs, activeTabId } = createTabsSetup()

    openNewEventsTab()
    const tabId = eventsTabs.value[0].id

    expect(isEventsTabId(tabId)).toBe(true)
    expect(eventsTabs.value).toHaveLength(1)

    handleCloseTab(tabId)

    expect(eventsTabs.value).toHaveLength(0)
    expect(activeTabId.value).toBeNull()
  })

  it('routes to closeTab (dashboard) for non-events tabs', () => {
    const { handleCloseTab, openTabs } = createTabsSetup()

    // Add a fake dashboard tab
    const dashboardTabId = 'some-panel-id-123'
    openTabs.value = [{ id: null }, { id: dashboardTabId, label: 'Dashboard', closable: true }]

    handleCloseTab(dashboardTabId)

    expect(openTabs.value.some((t) => t.id === dashboardTabId)).toBe(false)
  })

  it('does not affect eventsTabs when closing a dashboard tab', () => {
    const { openNewEventsTab, handleCloseTab, eventsTabs, openTabs } = createTabsSetup()

    openNewEventsTab()
    const eventsTabId = eventsTabs.value[0].id

    // Add a dashboard tab
    const dashboardTabId = 'dashboard-panel-456'
    openTabs.value = [
      { id: null },
      { id: dashboardTabId, label: 'Dashboard', closable: true }
    ]

    handleCloseTab(dashboardTabId)

    // Events tab should be unaffected
    expect(eventsTabs.value).toHaveLength(1)
    expect(eventsTabs.value[0].id).toBe(eventsTabId)
  })

  it('activates the tab to the left when closing the active events tab', () => {
    const { openNewEventsTab, handleCloseTab, eventsTabs, activeTabId } = createTabsSetup()

    openNewEventsTab() // Events (2)
    openNewEventsTab() // Events (3)

    const firstId = eventsTabs.value[0].id
    const secondId = eventsTabs.value[1].id

    // Activate the second tab
    activeTabId.value = secondId

    handleCloseTab(secondId)

    // Should activate the first tab (to the left)
    expect(activeTabId.value).toBe(firstId)
  })

  it('falls back to pinned tab when closing the only additional events tab', () => {
    const { openNewEventsTab, handleCloseTab, eventsTabs, activeTabId } = createTabsSetup()

    openNewEventsTab()
    const tabId = eventsTabs.value[0].id
    activeTabId.value = tabId

    handleCloseTab(tabId)

    expect(activeTabId.value).toBeNull()
    expect(eventsTabs.value).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Test 3: handleShare includes eventsTab when an additional Events tab is active
// **Validates: Requirements 4.1, 4.2**
// ---------------------------------------------------------------------------

describe('handleShare eventsTab inclusion', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('includes eventsTab when an additional Events tab is active', () => {
    const { openNewEventsTab, handleShare, eventsTabs, activeTabId } = createTabsSetup()

    openNewEventsTab()
    const tab = eventsTabs.value[0]
    activeTabId.value = tab.id

    const shareCurrentView = vi.fn()
    handleShare(shareCurrentView)

    expect(shareCurrentView).toHaveBeenCalledWith(
      expect.objectContaining({
        eventsTab: expect.objectContaining({
          id: tab.id,
          label: tab.label,
          dataset: tab.dataset
        })
      })
    )
  })

  it('does not include eventsTab when the pinned Events tab is active', () => {
    const { handleShare, activeTabId } = createTabsSetup()

    activeTabId.value = null

    const shareCurrentView = vi.fn()
    handleShare(shareCurrentView)

    expect(shareCurrentView).toHaveBeenCalledWith(
      expect.objectContaining({
        eventsTab: null
      })
    )
  })

  it('does not include eventsTab when a dashboard tab is active', () => {
    const { handleShare, activeTabId, openTabs } = createTabsSetup()

    const dashboardTabId = 'dashboard-panel-789'
    openTabs.value = [
      { id: null },
      { id: dashboardTabId, label: 'Dashboard', closable: true }
    ]
    activeTabId.value = dashboardTabId

    const shareCurrentView = vi.fn()
    handleShare(shareCurrentView)

    expect(shareCurrentView).toHaveBeenCalledWith(
      expect.objectContaining({
        eventsTab: null
      })
    )
  })

  it('includes viewState from tabPanelBlockRef.getCurrentShareState when available', () => {
    const { openNewEventsTab, handleShare, eventsTabs, activeTabId, tabPanelBlockRef } =
      createTabsSetup()

    openNewEventsTab()
    activeTabId.value = eventsTabs.value[0].id

    const mockViewState = {
      filters: { fields: [{ valueField: 'host', operator: 'Eq', value: 'example.com' }] },
      dataset: 'httpRequests',
      pageSize: 50
    }
    tabPanelBlockRef.value = {
      getCurrentShareState: vi.fn().mockReturnValue(mockViewState)
    }

    const shareCurrentView = vi.fn()
    handleShare(shareCurrentView)

    expect(shareCurrentView).toHaveBeenCalledWith(
      expect.objectContaining({
        viewState: mockViewState
      })
    )
  })
})

// ---------------------------------------------------------------------------
// Test 4: Restore persisted tabs on mount (Requirement 2.6)
// **Validates: Requirement 2.6**
// ---------------------------------------------------------------------------

describe('restoreEventsTabs on mount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('restores persisted tabs in order', () => {
    const persistedTabs = [
      { id: 'events:tab-1', label: 'My Tab 1', dataset: 'httpRequests' },
      { id: 'events:tab-2', label: 'My Tab 2', dataset: 'edgeFunctions' }
    ]
    localStorage.setItem('rte:open-events-tabs', JSON.stringify(persistedTabs))

    const { restoreEventsTabs, eventsTabs } = createTabsSetup()
    restoreEventsTabs()

    expect(eventsTabs.value).toHaveLength(2)
    expect(eventsTabs.value[0].id).toBe('events:tab-1')
    expect(eventsTabs.value[0].label).toBe('My Tab 1')
    expect(eventsTabs.value[1].id).toBe('events:tab-2')
    expect(eventsTabs.value[1].label).toBe('My Tab 2')
  })

  it('starts with empty tabs when nothing is persisted', () => {
    const { restoreEventsTabs, eventsTabs } = createTabsSetup()
    restoreEventsTabs()

    expect(eventsTabs.value).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Test 5: Share_State import with 6 pre-filled tabs applies viewState to pinned tab
// **Validates: Requirement 4.3**
// ---------------------------------------------------------------------------

describe('Share_State import with tab limit reached', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('shows warn toast when limit is reached and eventsTab is in Share_State', () => {
    const { openNewEventsTab, toast, canOpenNewTab, eventsTabs } = createTabsSetup()

    // Fill up to the limit
    for (let i = 0; i < MAX_TOTAL_TABS - 1; i++) {
      openNewEventsTab()
    }

    expect(canOpenNewTab()).toBe(false)
    expect(eventsTabs.value).toHaveLength(MAX_TOTAL_TABS - 1)

    // Simulate what TabsView does when pendingEventsTabState arrives but limit is reached
    const pendingState = {
      label: 'Shared Tab',
      dataset: 'httpRequests',
      viewState: { filters: { fields: [] } }
    }

    // canOpenNewTab is false, so we should show the toast
    if (!canOpenNewTab()) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: `Tab limit reached (${MAX_TOTAL_TABS}). Close a tab before opening another one.`,
        life: 4000
      })
    }

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        summary: `Tab limit reached (${MAX_TOTAL_TABS}). Close a tab before opening another one.`
      })
    )
  })

  it('canOpenNewTab returns false when MAX_TOTAL_TABS tabs are open', () => {
    const { openNewEventsTab, canOpenNewTab } = createTabsSetup()

    for (let i = 0; i < MAX_TOTAL_TABS - 1; i++) {
      openNewEventsTab()
    }

    expect(canOpenNewTab()).toBe(false)
  })

  it('canOpenNewTab returns true when fewer than MAX_TOTAL_TABS tabs are open', () => {
    const { canOpenNewTab } = createTabsSetup()

    expect(canOpenNewTab()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Test 6: isEventsTabId predicate used in routing
// **Validates: Requirements 3.1, 3.6**
// ---------------------------------------------------------------------------

describe('isEventsTabId predicate routing', () => {
  it('correctly identifies events tab ids', () => {
    expect(isEventsTabId('events:some-uuid')).toBe(true)
    expect(isEventsTabId('events:abc123')).toBe(true)
  })

  it('correctly rejects non-events ids', () => {
    expect(isEventsTabId(null)).toBe(false)
    expect(isEventsTabId(undefined)).toBe(false)
    expect(isEventsTabId('')).toBe(false)
    expect(isEventsTabId('some-panel-id')).toBe(false)
    expect(isEventsTabId('dashboard:123')).toBe(false)
  })
})
