/**
 * Feature: real-time-events-enhancements
 *
 * Property-based tests for TabsView integration.
 *
 * Task 16.7 — Property 3: Per-tab isolation (isEventsTabId predicate)
 * Task 16.8 — Property 4: combinedOpenTabs always has pinned tab at index 0
 *
 * **Validates: Requirements 3.1, 3.4, 3.5, 3.6**
 */
import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'
import fc from 'fast-check'
import { isEventsTabId } from '../composables/useEventsTabs.js'

// ---------------------------------------------------------------------------
// Task 16.7 — Property 3: isEventsTabId predicate isolation
// **Validates: Property 3, Requirements 3.1, 3.6**
// ---------------------------------------------------------------------------

describe('Property 3: isEventsTabId predicate', () => {
  it('returns true for any events:* id', () => {
    fc.assert(
      fc.property(
        // eslint-disable-next-line id-length
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim() !== ''),
        (suffix) => {
          const id = `events:${suffix}`
          expect(isEventsTabId(id)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns false for null', () => {
    expect(isEventsTabId(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isEventsTabId(undefined)).toBe(false)
  })

  it('returns false for any non-events string', () => {
    fc.assert(
      fc.property(
        // eslint-disable-next-line id-length
        fc.string({ minLength: 0, maxLength: 50 }).filter((s) => !s.startsWith('events:')),
        (id) => {
          expect(isEventsTabId(id)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns false for empty string', () => {
    expect(isEventsTabId('')).toBe(false)
  })

  it('returns false for dashboard-style ids (no events: prefix)', () => {
    fc.assert(
      fc.property(fc.uuid(), (uuid) => {
        // Plain UUIDs (dashboard tab ids) must not be treated as events tabs
        expect(isEventsTabId(uuid)).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('returns false for strings that start with "event:" (missing s)', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 30 }), (suffix) => {
        expect(isEventsTabId(`event:${suffix}`)).toBe(false)
      }),
      { numRuns: 50 }
    )
  })
})

// ---------------------------------------------------------------------------
// Task 16.8 — Property 4: combinedOpenTabs always has pinned tab at index 0
// **Validates: Property 4, Requirements 3.4, 3.5**
// ---------------------------------------------------------------------------

describe('Property 4: combinedOpenTabs always includes pinned tab at index 0', () => {
  /**
   * Build a combinedOpenTabs computed the same way TabsView.vue does it,
   * given arbitrary eventsTabs and dashboard openTabs.
   */
  function buildCombinedOpenTabs(eventsTabsArr, dashboardTabsArr) {
    const eventsTabs = ref(eventsTabsArr)
    const openTabs = ref(dashboardTabsArr)

    return computed(() => [
      { id: null, label: 'Events', icon: 'pi pi-list', closable: false },
      // eslint-disable-next-line id-length
      ...eventsTabs.value.map((t) => ({
        id: t.id,
        label: t.label,
        icon: 'pi pi-list',
        closable: true
      })),
      // eslint-disable-next-line id-length
      ...openTabs.value.filter((t) => t.id !== null)
    ])
  }

  const arbEventsTab = fc.record({
    id: fc
      .string({ minLength: 4, maxLength: 20 })
      // eslint-disable-next-line id-length
      .filter((s) => s.trim() !== '')
      // eslint-disable-next-line id-length
      .map((s) => `events:${s}`),
    // eslint-disable-next-line id-length
    label: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim() !== ''),
    dataset: fc.constantFrom(
      'httpRequests',
      'edgeFunctions',
      'edgeFunctionsConsole',
      'imageProcessor',
      'tieredCache',
      'edgeDNS',
      'dataStream',
      'activityHistory'
    )
  })

  const arbDashboardTab = fc.record({
    id: fc.uuid(),
    // eslint-disable-next-line id-length
    label: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim() !== ''),
    icon: fc.constant('pi pi-chart-bar'),
    closable: fc.constant(true)
  })

  it('pinned tab is always at index 0 regardless of additional tabs', () => {
    fc.assert(
      fc.property(
        fc.array(arbEventsTab, { maxLength: 5 }),
        fc.array(arbDashboardTab, { maxLength: 5 }),
        (eventsTabsArr, dashboardTabsArr) => {
          const combined = buildCombinedOpenTabs(eventsTabsArr, dashboardTabsArr)
          const tabs = combined.value

          // Pinned tab is always first
          expect(tabs.length).toBeGreaterThanOrEqual(1)
          expect(tabs[0].id).toBeNull()
          expect(tabs[0].label).toBe('Events')
          expect(tabs[0].closable).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('additional Events tabs appear after pinned tab and before dashboard tabs', () => {
    fc.assert(
      fc.property(
        fc.array(arbEventsTab, { minLength: 1, maxLength: 4 }),
        fc.array(arbDashboardTab, { minLength: 1, maxLength: 4 }),
        (eventsTabsArr, dashboardTabsArr) => {
          const combined = buildCombinedOpenTabs(eventsTabsArr, dashboardTabsArr)
          const tabs = combined.value

          // Pinned tab at 0
          expect(tabs[0].id).toBeNull()

          // Events tabs follow (indices 1..eventsTabsArr.length)
          // eslint-disable-next-line id-length
          for (let i = 0; i < eventsTabsArr.length; i++) {
            expect(tabs[1 + i].id).toBe(eventsTabsArr[i].id)
            expect(isEventsTabId(tabs[1 + i].id)).toBe(true)
          }

          // Dashboard tabs follow events tabs
          const dashboardStart = 1 + eventsTabsArr.length
          // eslint-disable-next-line id-length
          for (let i = 0; i < dashboardTabsArr.length; i++) {
            expect(tabs[dashboardStart + i].id).toBe(dashboardTabsArr[i].id)
            expect(isEventsTabId(tabs[dashboardStart + i].id)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('total tab count equals 1 + eventsTabs.length + dashboardTabs.length', () => {
    fc.assert(
      fc.property(
        fc.array(arbEventsTab, { maxLength: 5 }),
        fc.array(arbDashboardTab, { maxLength: 5 }),
        (eventsTabsArr, dashboardTabsArr) => {
          const combined = buildCombinedOpenTabs(eventsTabsArr, dashboardTabsArr)
          const tabs = combined.value

          expect(tabs.length).toBe(1 + eventsTabsArr.length + dashboardTabsArr.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('works with empty additional tabs (only pinned tab)', () => {
    const combined = buildCombinedOpenTabs([], [])
    const tabs = combined.value

    expect(tabs).toHaveLength(1)
    expect(tabs[0].id).toBeNull()
    expect(tabs[0].label).toBe('Events')
  })
})
