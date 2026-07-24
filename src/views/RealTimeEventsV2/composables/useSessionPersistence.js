export const TABS_STORAGE_KEY = 'rte:open-tabs'
export const ACTIVE_TAB_STORAGE_KEY = 'rte:active-tab'

// Legacy dataset name aliases. Sessions persisted with the old GraphQL dataset
// identifiers are transparently migrated at load time so the UI keeps working
// without forcing users to re-save. Rewrites are in-memory only; the next
// explicit save materializes the new identifier on disk.
export const LEGACY_DATASET_ALIASES = Object.freeze({
  httpEvents: 'workloadEvents',
  edgeFunctionsEvents: 'functionEvents',
  cellsConsoleEvents: 'functionConsoleEvents',
  imageProcessedEvents: 'imagesProcessedEvents',
  l2CacheEvents: 'tieredCacheEvents',
  idnsQueriesEvents: 'edgeDnsQueriesEvents'
})

export const migrateLegacyDataset = (panel) => {
  const dataset = panel?.eventsConfig?.dataset
  if (!dataset) return panel
  const renamed = LEGACY_DATASET_ALIASES[dataset]
  if (!renamed) return panel
  return {
    ...panel,
    eventsConfig: { ...panel.eventsConfig, dataset: renamed }
  }
}

/**
 * localStorage persistence for RTE Dashboard tabs (read/write + schema
 * migration seam). Owns the two storage keys and the persist/restore pair;
 * mutates the injected `openTabs`/`activeTabId` refs on restore. Kept free of
 * URL and CRUD concerns so it can be unit-tested in isolation.
 *
 * @param {Object} deps
 * @param {import('vue').Ref<Array>} deps.openTabs – the open Dashboard tabs ref
 * @param {import('vue').Ref} deps.activeTabId – active tab id ref
 * @param {import('vue').Ref<Array>} deps.panels – loaded panels ref
 * @param {Object} deps.eventsTab – the pinned Events tab object (always first)
 * @param {number} deps.maxTotalTabs – unified ceiling for the fallback restore cap
 * @param {((reservedCount?: number) => number)|null} [deps.capForRestore=null] – ceiling-aware cap
 * @param {(() => number)|null} [deps.reservedTabCount=null] – slots consumed by other tab kinds
 */
export function useSessionPersistence({
  openTabs,
  activeTabId,
  panels,
  eventsTab,
  maxTotalTabs,
  capForRestore = null,
  reservedTabCount = null
}) {
  const reservedTabCountFn = typeof reservedTabCount === 'function' ? reservedTabCount : () => 0

  const persistTabs = () => {
    try {
      const persistable = openTabs.value
        .filter((tab) => tab.id !== null && tab.type !== 'shared')
        .map((tab) => tab.id)
      localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(persistable))
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTabId.value ?? '')
    } catch {
      // ignore (localStorage unavailable)
    }
  }

  const restoreTabs = () => {
    try {
      const raw = localStorage.getItem(TABS_STORAGE_KEY)
      if (!raw) return
      const ids = JSON.parse(raw)
      if (!Array.isArray(ids)) return
      const validIds = ids.filter((id) => panels.value.some((panel) => panel.id === id))
      // Ceiling-aware restore (req 2.1): reserve the pinned Events tab plus any
      // additional Events tabs already present, then slice against the SAME
      // unified ceiling as admission (injected cap or maxTotalTabs fallback).
      const reserved = 1 + reservedTabCountFn()
      const restoreCap =
        typeof capForRestore === 'function'
          ? capForRestore(reserved)
          : Math.max(0, maxTotalTabs - reserved)
      const restored = validIds.slice(0, restoreCap).map((id) => {
        const panel = panels.value.find((item) => item.id === id)
        return { id: panel.id, label: panel.label, icon: panel.icon, closable: true }
      })
      openTabs.value = [eventsTab, ...restored]
      const savedActive = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY)
      if (savedActive && openTabs.value.some((tab) => String(tab.id) === savedActive)) {
        activeTabId.value = savedActive === '' ? null : savedActive
      }
    } catch {
      // ignore
    }
  }

  return { persistTabs, restoreTabs }
}
