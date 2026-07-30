/* global globalThis */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import {
  useSessionPersistence,
  migrateLegacyDataset,
  LEGACY_DATASET_ALIASES,
  TABS_STORAGE_KEY,
  ACTIVE_TAB_STORAGE_KEY
} from '../useSessionPersistence.js'

const EVENTS_TAB = Object.freeze({ id: null, label: 'Events', icon: 'pi pi-list', closable: false })
const MAX_TOTAL_TABS = 6

function makePanel(id) {
  return { id, label: `Panel ${id}`, icon: 'pi pi-star', type: 'custom' }
}

function makeHarness({ panels = [], reservedTabCount = null, capForRestore = null } = {}) {
  const openTabs = ref([EVENTS_TAB])
  const activeTabId = ref(null)
  const panelsRef = ref(panels)
  const { persistTabs, restoreTabs } = useSessionPersistence({
    openTabs,
    activeTabId,
    panels: panelsRef,
    eventsTab: EVENTS_TAB,
    maxTotalTabs: MAX_TOTAL_TABS,
    capForRestore,
    reservedTabCount
  })
  return { openTabs, activeTabId, panelsRef, persistTabs, restoreTabs }
}

describe('migrateLegacyDataset', () => {
  it('rewrites a legacy dataset identifier to its current alias', () => {
    const migrated = migrateLegacyDataset({ eventsConfig: { dataset: 'httpEvents', foo: 1 } })
    expect(migrated.eventsConfig.dataset).toBe(LEGACY_DATASET_ALIASES.httpEvents)
    expect(migrated.eventsConfig.foo).toBe(1)
  })

  it('returns the panel untouched when there is no dataset or no alias', () => {
    const noDataset = { eventsConfig: {} }
    expect(migrateLegacyDataset(noDataset)).toBe(noDataset)
    const unknown = { eventsConfig: { dataset: 'workloadEvents' } }
    expect(migrateLegacyDataset(unknown)).toBe(unknown)
  })
})

describe('useSessionPersistence', () => {
  beforeEach(() => globalThis.localStorage.clear())
  afterEach(() => globalThis.localStorage.clear())

  it('persistTabs writes non-pinned, non-shared tab ids and the active id', () => {
    const { openTabs, activeTabId, persistTabs } = makeHarness()
    openTabs.value = [
      EVENTS_TAB,
      { id: 'a', closable: true },
      { id: 's', closable: true, type: 'shared' }
    ]
    activeTabId.value = 'a'

    persistTabs()

    expect(JSON.parse(globalThis.localStorage.getItem(TABS_STORAGE_KEY))).toEqual(['a'])
    expect(globalThis.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY)).toBe('a')
  })

  it('restoreTabs rebuilds openTabs from valid persisted ids and the active id', () => {
    const { openTabs, activeTabId, restoreTabs } = makeHarness({
      panels: [makePanel('a'), makePanel('b')]
    })
    globalThis.localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(['a', 'b', 'ghost']))
    globalThis.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, 'b')

    restoreTabs()

    expect(openTabs.value.map((tab) => tab.id)).toEqual([null, 'a', 'b'])
    expect(activeTabId.value).toBe('b')
  })

  it('restoreTabs honors the fallback ceiling (maxTotalTabs minus reserved)', () => {
    const panels = Array.from({ length: MAX_TOTAL_TABS + 2 }, (_unused, idx) =>
      makePanel(`p${idx}`)
    )
    const { openTabs, restoreTabs } = makeHarness({ panels })
    globalThis.localStorage.setItem(
      TABS_STORAGE_KEY,
      JSON.stringify(panels.map((panel) => panel.id))
    )

    restoreTabs()

    // pinned + (MAX_TOTAL_TABS - 1 reserved slot) restored dashboard tabs.
    expect(openTabs.value.filter((tab) => tab.id !== null).length).toBe(MAX_TOTAL_TABS - 1)
  })

  it('restoreTabs uses the injected capForRestore when provided', () => {
    const panels = [makePanel('a'), makePanel('b'), makePanel('c')]
    const { openTabs, restoreTabs } = makeHarness({ panels, capForRestore: () => 1 })
    globalThis.localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(['a', 'b', 'c']))

    restoreTabs()

    expect(openTabs.value.map((tab) => tab.id)).toEqual([null, 'a'])
  })

  it('restoreTabs is a no-op when nothing is persisted', () => {
    const { openTabs, restoreTabs } = makeHarness({ panels: [makePanel('a')] })
    restoreTabs()
    expect(openTabs.value.map((tab) => tab.id)).toEqual([null])
  })
})
