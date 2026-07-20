import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import fc from 'fast-check'
import { useEventsTabs } from '../useEventsTabs.js'
import { useTabLimit, MAX_TOTAL_TABS } from '../useTabLimit.js'

/* global globalThis */

/**
 * Feature: real-time-events-enhancements
 *
 * **Validates: Requirements 1.3, 1.5, 1.6, 1.7, 1.9, 1.11, 2.1, 2.3, 2.4, 2.5, 2.7, 10.1, 10.2**
 */

// ---------------------------------------------------------------------------
// Shared factory
// ---------------------------------------------------------------------------

/**
 * Create a fresh composable instance with a pinned tab already in openTabs.
 * openTabs is kept in sync with eventsTabs after each command so that
 * totalTabCount() reflects the real total (pinned + additional).
 */
function createComposable() {
  const activeTabId = ref(null)
  const openTabs = ref([{ id: null }]) // pinned tab
  const toast = { add: vi.fn() }
  const { totalTabCount } = useTabLimit({ openTabs })
  const tabs = useEventsTabs({ toast, totalTabCount, activeTabId })
  return { tabs, activeTabId, openTabs, toast }
}

/** Sync openTabs so totalTabCount() stays accurate. */
function syncOpenTabs(openTabs, tabs) {
  openTabs.value = [{ id: null }, ...tabs.eventsTabs.value]
}

// ---------------------------------------------------------------------------
// Task 4.2 — Property 1: Tab-structure invariants
// **Validates: Property 1, Requirements 1.3, 1.5, 1.6, 1.7, 1.9, 1.11, 10.1**
// ---------------------------------------------------------------------------

describe('Property 1: Tab-structure invariants (fc.commands)', () => {
  const DATASETS = [
    'httpRequests',
    'edgeFunctions',
    'edgeFunctionsConsole',
    'imageProcessor',
    'tieredCache',
    'edgeDNS',
    'dataStream',
    'activityHistory'
  ]

  /**
   * Assert all structural invariants against the current composable state.
   * Called after every command execution.
   */
  // eslint-disable-next-line no-unused-vars
  function assertInvariants(tabs, activeTabId, openTabs) {
    const evTabs = tabs.eventsTabs.value

    // (a) length <= MAX_TOTAL_TABS - 1  (additional tabs only; pinned is separate)
    expect(evTabs.length).toBeLessThanOrEqual(MAX_TOTAL_TABS - 1)

    // (b) Labels among additional Events tabs are unique
    // eslint-disable-next-line id-length
    const labels = evTabs.map((t) => t.label)
    const uniqueLabels = new Set(labels)
    expect(uniqueLabels.size).toBe(labels.length)

    // (c) activeTabId is either null (pinned) or present in eventsTabs
    const active = activeTabId.value
    if (active !== null) {
      // eslint-disable-next-line id-length
      const ids = evTabs.map((t) => t.id)
      expect(ids).toContain(active)
    }

    // (d) All tab ids start with 'events:'
    // eslint-disable-next-line id-length
    for (const t of evTabs) {
      expect(t.id).toMatch(/^events:/)
    }
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  class OpenCommand {
    constructor(label, dataset) {
      this.label = label
      this.dataset = dataset
    }

    check() {
      return true
    }

    run(model, real) {
      const { tabs, activeTabId, openTabs } = real
      const opts = {}
      if (this.label !== null) opts.label = this.label
      if (this.dataset !== null) opts.dataset = this.dataset

      tabs.openEventsTab(opts)
      syncOpenTabs(openTabs, tabs)

      // (e) Additional tabs are closable — verify by checking closeEventsTab removes them
      // We verify this lazily: every tab in eventsTabs can be found and removed.
      // eslint-disable-next-line id-length
      for (const t of tabs.eventsTabs.value) {
        expect(tabs.isEventsTabId(t.id)).toBe(true)
      }

      assertInvariants(tabs, activeTabId, openTabs)
    }

    toString() {
      return `OpenCommand(label=${this.label}, dataset=${this.dataset})`
    }
  }

  class CloseCommand {
    check(model) {
      return model.tabCount > 0
    }

    run(model, real) {
      const { tabs, activeTabId, openTabs } = real
      const evTabs = tabs.eventsTabs.value
      if (evTabs.length === 0) return

      // Pick a random tab by index stored in model
      const idx = model.closeIdx % evTabs.length
      const tabToClose = evTabs[idx]
      const wasActive = activeTabId.value === tabToClose.id
      const prevIdx = idx // index before removal

      tabs.closeEventsTab(tabToClose.id)
      syncOpenTabs(openTabs, tabs)

      // (f) When closing the active tab, activeTabId shifts to left neighbor or null
      if (wasActive) {
        const newTabs = tabs.eventsTabs.value
        if (prevIdx > 0) {
          // Should activate the tab that was immediately to the left
          const expectedId = newTabs[prevIdx - 1]?.id ?? null
          expect(activeTabId.value).toBe(expectedId)
        } else {
          // Was the first additional tab — fall back to pinned (null)
          expect(activeTabId.value).toBe(null)
        }
      }

      assertInvariants(tabs, activeTabId, openTabs)
    }

    toString() {
      return `CloseCommand(closeIdx=${this.closeIdx})`
    }
  }

  class RenameCommand {
    constructor(label) {
      this.label = label
    }

    check(model) {
      return model.tabCount > 0
    }

    run(model, real) {
      const { tabs, activeTabId, openTabs } = real
      const evTabs = tabs.eventsTabs.value
      if (evTabs.length === 0) return

      const idx = model.renameIdx % evTabs.length
      const tabToRename = evTabs[idx]

      tabs.renameEventsTab(tabToRename.id, this.label)
      syncOpenTabs(openTabs, tabs)

      assertInvariants(tabs, activeTabId, openTabs)
    }

    toString() {
      return `RenameCommand(label=${this.label})`
    }
  }

  class ActivateCommand {
    check(model) {
      return model.tabCount > 0
    }

    run(model, real) {
      const { tabs, activeTabId, openTabs } = real
      const evTabs = tabs.eventsTabs.value
      if (evTabs.length === 0) {
        activeTabId.value = null
      } else {
        const idx = model.activateIdx % evTabs.length
        activeTabId.value = evTabs[idx].id
      }
      syncOpenTabs(openTabs, tabs)

      assertInvariants(tabs, activeTabId, openTabs)
    }

    toString() {
      return `ActivateCommand(activateIdx=${this.activateIdx})`
    }
  }

  // ── Arbitraries ───────────────────────────────────────────────────────────

  const arbLabel = fc.oneof(
    fc.constant(null),
    // eslint-disable-next-line id-length
    fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim() !== '' && s.trim() !== '-')
  )

  const arbDataset = fc.oneof(fc.constant(null), fc.constantFrom(...DATASETS))

  const arbOpenCmd = fc
    .record({ label: arbLabel, dataset: arbDataset })
    .map(({ label, dataset }) => new OpenCommand(label, dataset))

  const arbCloseCmd = fc.integer({ min: 0, max: 100 }).map((closeIdx) => {
    const cmd = new CloseCommand()
    cmd.closeIdx = closeIdx
    return cmd
  })

  const arbRenameCmd = fc
    .string({ minLength: 1, maxLength: 40 })
    // eslint-disable-next-line id-length
    .filter((s) => s.trim() !== '' && s.trim() !== '-')
    .map((label) => new RenameCommand(label))

  const arbActivateCmd = fc.integer({ min: 0, max: 100 }).map((activateIdx) => {
    const cmd = new ActivateCommand()
    cmd.activateIdx = activateIdx
    return cmd
  })

  const arbCommand = fc.oneof(arbOpenCmd, arbCloseCmd, arbRenameCmd, arbActivateCmd)

  it('structural invariants hold after any sequence of tab operations', () => {
    fc.assert(
      fc.property(fc.array(arbCommand, { minLength: 1, maxLength: 20 }), (commands) => {
        const real = createComposable()

        // Model tracks tab count and indices for commands
        const model = { tabCount: 0, closeIdx: 0, renameIdx: 0, activateIdx: 0 }

        for (const cmd of commands) {
          // Update model indices from command if available
          if (cmd.closeIdx !== undefined) model.closeIdx = cmd.closeIdx
          if (cmd.renameIdx !== undefined) model.renameIdx = cmd.renameIdx
          if (cmd.activateIdx !== undefined) model.activateIdx = cmd.activateIdx

          if (cmd.check(model)) {
            cmd.run(model, real)
          }

          model.tabCount = real.tabs.eventsTabs.value.length
        }
      }),
      { numRuns: 50 }
    )
  })
})

// ---------------------------------------------------------------------------
// Task 4.3 — Property 2: Events-tab persistence round-trip
// **Validates: Property 2, Requirements 2.1, 2.3, 2.7, 10.2**
// ---------------------------------------------------------------------------

describe('Property 2: Events-tab persistence round-trip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    globalThis.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.localStorage.clear()
  })

  const DATASETS = [
    'httpRequests',
    'edgeFunctions',
    'edgeFunctionsConsole',
    'imageProcessor',
    'tieredCache',
    'edgeDNS',
    'dataStream',
    'activityHistory'
  ]

  const arbTabList = fc.array(
    fc.record({
      id: fc
        .string({ minLength: 8, maxLength: 20 })
        // eslint-disable-next-line id-length
        .filter((s) => s.trim() !== '')
        // eslint-disable-next-line id-length
        .map((s) => `events:${s}`),
      // eslint-disable-next-line id-length
      label: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim() !== ''),
      dataset: fc.constantFrom(...DATASETS)
    }),
    { maxLength: 5 } // MAX_TOTAL_TABS - 1
  )

  it('persistEventsTabs then restoreEventsTabs yields the same list', () => {
    fc.assert(
      fc.property(arbTabList, (generatedList) => {
        globalThis.localStorage.clear()

        // ── Write side ──────────────────────────────────────────────────────
        const { tabs: writeTabs } = createComposable()

        // Directly set eventsTabs to the generated list
        writeTabs.eventsTabs.value = generatedList

        // Trigger persist (debounced at 100 ms) and flush the timer
        writeTabs.persistEventsTabs()
        vi.runAllTimers()

        // ── Read side ───────────────────────────────────────────────────────
        const { tabs: readTabs } = createComposable()
        readTabs.restoreEventsTabs()

        const restored = readTabs.eventsTabs.value

        if (generatedList.length <= MAX_TOTAL_TABS - 1) {
          // Full round-trip: restored list deep-equals the input
          expect(restored).toEqual(generatedList)
        } else {
          // Truncated: only the first MAX_TOTAL_TABS - 1 entries are restored
          expect(restored).toEqual(generatedList.slice(0, MAX_TOTAL_TABS - 1))
        }
      }),
      { numRuns: 100 }
    )
  })

  it('round-trip preserves order of entries', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc
              .string({ minLength: 8, maxLength: 20 })
              // eslint-disable-next-line id-length
              .filter((s) => s.trim() !== '')
              // eslint-disable-next-line id-length
              .map((s) => `events:${s}`),
            // eslint-disable-next-line id-length
            label: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim() !== ''),
            dataset: fc.constantFrom(...DATASETS)
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (generatedList) => {
          globalThis.localStorage.clear()

          const { tabs: writeTabs } = createComposable()
          writeTabs.eventsTabs.value = generatedList
          writeTabs.persistEventsTabs()
          vi.runAllTimers()

          const { tabs: readTabs } = createComposable()
          readTabs.restoreEventsTabs()

          const restored = readTabs.eventsTabs.value
          const expected = generatedList.slice(0, MAX_TOTAL_TABS - 1)

          // Order must be preserved
          // eslint-disable-next-line id-length
          for (let i = 0; i < restored.length; i++) {
            expect(restored[i].id).toBe(expected[i].id)
            expect(restored[i].label).toBe(expected[i].label)
            expect(restored[i].dataset).toBe(expected[i].dataset)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// Task 4.4 — Unit tests: malformed-payload fallback and filterData non-persistence
// **Validates: Requirements 2.4, 2.5**
// ---------------------------------------------------------------------------

describe('Unit tests: malformed-payload fallback and filterData non-persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    globalThis.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.localStorage.clear()
  })

  describe('Malformed payloads return [] without console.error', () => {
    it('non-JSON string returns []', () => {
      const consoleSpy = vi.spyOn(console, 'error')

      globalThis.localStorage.setItem('rte:open-events-tabs', 'not-json')

      const { tabs } = createComposable()
      tabs.restoreEventsTabs()

      expect(tabs.eventsTabs.value).toEqual([])
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('JSON number returns []', () => {
      const consoleSpy = vi.spyOn(console, 'error')

      globalThis.localStorage.setItem('rte:open-events-tabs', '42')

      const { tabs } = createComposable()
      tabs.restoreEventsTabs()

      expect(tabs.eventsTabs.value).toEqual([])
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('JSON object (not array) returns []', () => {
      const consoleSpy = vi.spyOn(console, 'error')

      globalThis.localStorage.setItem('rte:open-events-tabs', '{"key":"value"}')

      const { tabs } = createComposable()
      tabs.restoreEventsTabs()

      expect(tabs.eventsTabs.value).toEqual([])
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('null stored value returns []', () => {
      const consoleSpy = vi.spyOn(console, 'error')

      // localStorage.getItem returns null when key is absent
      globalThis.localStorage.removeItem('rte:open-events-tabs')

      const { tabs } = createComposable()
      tabs.restoreEventsTabs()

      expect(tabs.eventsTabs.value).toEqual([])
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('array with invalid entries (missing id prefix) returns only valid entries', () => {
      const consoleSpy = vi.spyOn(console, 'error')

      const payload = JSON.stringify([
        { id: 'events:valid-id', label: 'Valid', dataset: 'httpRequests' },
        { id: 'bad-id', label: 'Bad', dataset: 'httpRequests' }, // missing 'events:' prefix
        { id: null, label: 'Null id', dataset: 'httpRequests' }, // null id
        { label: 'No id', dataset: 'httpRequests' } // missing id entirely
      ])
      globalThis.localStorage.setItem('rte:open-events-tabs', payload)

      const { tabs } = createComposable()
      tabs.restoreEventsTabs()

      // Only the valid entry should be restored
      expect(tabs.eventsTabs.value).toHaveLength(1)
      expect(tabs.eventsTabs.value[0].id).toBe('events:valid-id')
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('persistEventsTabs() never writes filterData', () => {
    it('filterData key is absent from the persisted JSON', () => {
      const { tabs } = createComposable()

      // Set a tab that has a filterData property (should NOT be persisted)
      tabs.eventsTabs.value = [
        {
          id: 'events:abc',
          label: 'Test',
          dataset: 'httpRequests',
          filterData: { fields: ['host'] }
        }
      ]

      tabs.persistEventsTabs()
      vi.runAllTimers()

      const raw = globalThis.localStorage.getItem('rte:open-events-tabs')
      expect(raw).not.toBeNull()

      const parsed = JSON.parse(raw)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(1)

      // No entry should have a filterData key
      for (const entry of parsed) {
        expect(entry).not.toHaveProperty('filterData')
      }
    })

    it('persisted entries contain only id, label, and dataset', () => {
      const { tabs } = createComposable()

      tabs.eventsTabs.value = [
        {
          id: 'events:abc',
          label: 'Test',
          dataset: 'httpRequests',
          filterData: { fields: ['host'] },
          selectedFields: ['host', 'status'],
          pageSize: 100,
          selectedView: 'events:status'
        }
      ]

      tabs.persistEventsTabs()
      vi.runAllTimers()

      const raw = globalThis.localStorage.getItem('rte:open-events-tabs')
      const parsed = JSON.parse(raw)

      expect(parsed[0]).toEqual({
        id: 'events:abc',
        label: 'Test',
        dataset: 'httpRequests'
      })
    })

    it('multiple tabs with filterData — none persisted', () => {
      const { tabs } = createComposable()

      tabs.eventsTabs.value = [
        {
          id: 'events:tab1',
          label: 'Tab 1',
          dataset: 'httpRequests',
          filterData: { fields: ['host', 'status'] }
        },
        {
          id: 'events:tab2',
          label: 'Tab 2',
          dataset: 'edgeFunctions',
          filterData: { fields: ['configurationId'] }
        }
      ]

      tabs.persistEventsTabs()
      vi.runAllTimers()

      const raw = globalThis.localStorage.getItem('rte:open-events-tabs')
      const parsed = JSON.parse(raw)

      expect(parsed).toHaveLength(2)
      for (const entry of parsed) {
        expect(entry).not.toHaveProperty('filterData')
        expect(Object.keys(entry).sort()).toEqual(['dataset', 'id', 'label'])
      }
    })
  })
})
