import { ref, computed } from 'vue'
import {
  loadPanels,
  loadPanelsWithMeta,
  savePanel,
  updatePanel,
  deletePanel,
  encodeShareState,
  decodeShareState,
  filterValidCharts
} from '@/services/panels-service'
import REPORTS from '@/modules/real-time-metrics/constants/reports'

// Maximum number of simultaneously open tabs (excluding the fixed "Events" tab).
// Kept as an exported constant for easy tweaking without touching call sites.
export const MAX_OPEN_TABS = 5

const TABS_STORAGE_KEY = 'rte:open-tabs'
const ACTIVE_TAB_STORAGE_KEY = 'rte:active-tab'

// Legacy dataset name aliases. Sessions persisted with the old GraphQL dataset
// identifiers are transparently migrated at load time so the UI keeps working
// without forcing users to re-save every session. Rewrites happen in-memory
// only; the next explicit save materializes the new identifier on disk.
const LEGACY_DATASET_ALIASES = Object.freeze({
  httpEvents: 'workloadEvents',
  edgeFunctionsEvents: 'functionEvents',
  cellsConsoleEvents: 'functionConsoleEvents',
  imagesProcessedEvents: 'imageProcessedEvents',
  l2CacheEvents: 'tieredCacheEvents',
  idnsQueriesEvents: 'edgeDnsQueriesEvents'
})

const migrateLegacyDataset = (panel) => {
  const dataset = panel?.eventsConfig?.dataset
  if (!dataset) return panel
  const renamed = LEGACY_DATASET_ALIASES[dataset]
  if (!renamed) return panel
  return {
    ...panel,
    eventsConfig: { ...panel.eventsConfig, dataset: renamed }
  }
}

// Fixed first tab representing the raw events explorer.
export const EVENTS_TAB = Object.freeze({
  id: null,
  label: 'Events',
  icon: 'pi pi-list',
  closable: false
})

/**
 * Composable for managing Real-Time Events sessions (panels).
 * Handles CRUD, URL synchronisation, sharing, and import.
 *
 * Extracted from TabsView.vue to keep the component thin.
 *
 * @param {Object} options
 * @param {import('vue-router').RouteLocationNormalized} options.route  – current route
 * @param {import('vue-router').Router}                  options.router – router instance
 * @param {Object}                                        options.toast  – PrimeVue toast service
 */
export function useSessionManager({ route, router, toast }) {
  const openTabs = ref([EVENTS_TAB])
  const activeTabId = ref(null)
  const panels = ref([])
  const sessionBrowserVisible = ref(false)
  const sessionCreatorVisible = ref(false)
  const editingPanel = ref(null)
  const localStorageAvailable = ref(true)
  // Ephemeral shared tab, created from ?shareState=... but never persisted.
  const sharedTabState = ref(null)

  const availableReports = computed(() => {
    return Array.isArray(REPORTS) ? REPORTS : []
  })

  // Legacy-compatibility backfill: early custom sessions were persisted with
  // only `charts: [{ reportId }]` and no `metricsDashboardIds`. DashboardPanel
  // renders nothing when the latter is empty, so we derive it lazily from the
  // referenced reports. Persisted data is untouched — the next save (edit)
  // will materialize the field.
  const withDashboardIds = (panel) => {
    if (!panel || panel.type !== 'custom') return panel
    const alreadyHas = Array.isArray(panel.metricsDashboardIds) && panel.metricsDashboardIds.length
    if (alreadyHas) return panel
    const reportIds = (panel.charts || []).map((chartRef) => chartRef?.reportId).filter(Boolean)
    if (!reportIds.length) return panel
    const reportsById = new Map(availableReports.value.map((report) => [report.id, report]))
    const derived = Array.from(
      new Set(reportIds.map((id) => reportsById.get(id)?.dashboardId).filter(Boolean))
    )
    return derived.length ? { ...panel, metricsDashboardIds: derived } : panel
  }

  const activePanelConfig = computed(() => {
    if (!activeTabId.value) return null
    if (sharedTabState.value && sharedTabState.value.id === activeTabId.value) {
      return withDashboardIds(migrateLegacyDataset(sharedTabState.value.panelConfig))
    }
    const panel = panels.value.find((panelItem) => panelItem.id === activeTabId.value) || null
    return withDashboardIds(migrateLegacyDataset(panel))
  })

  // Backwards-compat alias (kept for existing consumers).
  const activePanel = activeTabId

  // ── localStorage persistence ──
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
      const restored = validIds.slice(0, MAX_OPEN_TABS).map((id) => {
        const panel = panels.value.find((item) => item.id === id)
        return { id: panel.id, label: panel.label, icon: panel.icon, closable: true }
      })
      openTabs.value = [EVENTS_TAB, ...restored]
      const savedActive = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY)
      if (savedActive && openTabs.value.some((tab) => String(tab.id) === savedActive)) {
        activeTabId.value = savedActive === '' ? null : savedActive
      }
    } catch {
      // ignore
    }
  }

  // ── URL sync helpers ──
  const syncUrlWithPanel = () => {
    const { name, params, query } = route
    const newQuery = { ...query }

    if (activeTabId.value) {
      newQuery.panel = activeTabId.value
    } else {
      delete newQuery.panel
    }

    router.replace({ name, params, query: newQuery })
  }

  const removeQueryParam = (paramName) => {
    const { name, params, query } = route
    const newQuery = { ...query }
    delete newQuery[paramName]
    router.replace({ name, params, query: newQuery })
  }

  // ── Tab management ──
  const openTab = (panelId) => {
    if (panelId === null || panelId === undefined) {
      activeTabId.value = null
      syncUrlWithPanel()
      persistTabs()
      return
    }
    const alreadyOpen = openTabs.value.some((tab) => tab.id === panelId)
    if (!alreadyOpen) {
      const extraCount = openTabs.value.filter((tab) => tab.id !== null).length
      if (extraCount >= MAX_OPEN_TABS) {
        toast.add({
          closable: true,
          severity: 'warn',
          summary: `Tab limit reached (${MAX_OPEN_TABS})`,
          detail: 'Close a tab before opening another one.',
          life: 4000
        })
        return
      }
      const panel = panels.value.find((item) => item.id === panelId)
      if (!panel) return
      openTabs.value = [
        ...openTabs.value,
        { id: panel.id, label: panel.label, icon: panel.icon, closable: true }
      ]
    }
    activeTabId.value = panelId
    syncUrlWithPanel()
    persistTabs()
  }

  const closeTab = (panelId) => {
    if (panelId === null) return // Events tab is non-closable
    const idx = openTabs.value.findIndex((tab) => tab.id === panelId)
    if (idx <= 0) return
    const wasActive = activeTabId.value === panelId
    openTabs.value = openTabs.value.filter((tab) => tab.id !== panelId)
    if (wasActive) {
      // Activate previous tab (or Events if only Events left)
      const next = openTabs.value[Math.max(0, idx - 1)]
      activeTabId.value = next ? next.id : null
      syncUrlWithPanel()
    }
    if (sharedTabState.value && sharedTabState.value.id === panelId) {
      sharedTabState.value = null
    }
    persistTabs()
  }

  const setActiveTab = (panelId) => {
    if (!openTabs.value.some((tab) => tab.id === panelId)) return
    activeTabId.value = panelId
    syncUrlWithPanel()
    persistTabs()
  }

  // Backwards-compat alias
  const selectPanel = openTab

  // ── Session creator ──
  const openSessionCreator = (panelConfig = null) => {
    editingPanel.value = panelConfig
    sessionCreatorVisible.value = true
  }

  // ── Session CRUD ──
  const handleSessionSave = (config) => {
    try {
      if (editingPanel.value) {
        updatePanel(config.id, config)
      } else {
        savePanel(config)
      }
      panels.value = loadPanels()
      openTab(config.id)
      toast.add({
        closable: true,
        severity: 'success',
        summary: editingPanel.value ? 'Session updated' : 'Session created',
        detail: config.label,
        life: 3000
      })
    } catch (err) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error saving session',
        detail: String(err).slice(0, 100),
        life: 5000
      })
    }
    editingPanel.value = null
  }

  const editSession = (panelId) => {
    const panel = panels.value.find((item) => item.id === panelId)
    if (panel && panel.type === 'custom') {
      openSessionCreator(panel)
    }
  }

  const deleteSession = (panelId) => {
    try {
      deletePanel(panelId)
      panels.value = loadPanels()
      // Close the tab if open
      if (openTabs.value.some((tab) => tab.id === panelId)) {
        closeTab(panelId)
      }
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Session deleted',
        life: 3000
      })
    } catch (err) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error deleting session',
        detail: String(err).slice(0, 100),
        life: 5000
      })
    }
  }

  /**
   * Share the current view (active tab + its filter/dataset state).
   * @param {object} viewState - { filters, tsRange, dataset, pageSize, documentQuery }
   */
  const shareCurrentView = (viewState = {}) => {
    try {
      const state = {
        tab: activeTabId.value,
        viewState
      }
      // Include panel config inline for custom tabs so the recipient can open it
      // without needing the originator to have already shared the panel.
      if (activeTabId.value) {
        const panel = panels.value.find((item) => item.id === activeTabId.value)
        if (panel && panel.type === 'custom') {
          state.panelConfig = panel
        }
      }
      const encoded = encodeShareState(state)
      const url = new URL(window.location.href)
      url.searchParams.delete('panel')
      url.searchParams.delete('panelConfig')
      url.searchParams.set('shareState', encoded)
      navigator.clipboard.writeText(url.toString())
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Share URL copied to clipboard',
        life: 3000
      })
    } catch (err) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error generating share URL',
        detail: String(err).slice(0, 100),
        life: 5000
      })
    }
  }

  // ── Share state import from URL ──
  // Returns the decoded viewState so callers can apply it to the active panel.
  const pendingShareViewState = ref(null)

  const handleShareImport = () => {
    const encoded = route.query.shareState
    if (!encoded) return

    const decoded = decodeShareState(encoded)
    if (!decoded) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Invalid share link',
        life: 5000
      })
      removeQueryParam('shareState')
      return
    }

    // If the share contains a custom panel that isn't already local, create an
    // ephemeral shared tab (not persisted; users can "Save" via existing flows).
    if (decoded.panelConfig) {
      const cfg = decoded.panelConfig
      const exists = panels.value.some((panel) => panel.id === cfg.id)
      if (!exists) {
        sharedTabState.value = {
          id: cfg.id,
          panelConfig: { ...cfg, type: 'shared' }
        }
        openTabs.value = [
          ...openTabs.value,
          { id: cfg.id, label: cfg.label, icon: cfg.icon, closable: true, shared: true }
        ]
      }
    }

    if (decoded.tab !== undefined) {
      const tabId = decoded.tab
      if (tabId === null || openTabs.value.some((tab) => tab.id === tabId)) {
        activeTabId.value = tabId
      }
    }

    if (decoded.viewState) {
      pendingShareViewState.value = decoded.viewState
    }

    removeQueryParam('shareState')
  }

  // ── Read panel selection from URL ──
  const readPanelFromUrl = () => {
    const panelParam = route.query.panel
    if (panelParam) {
      const found = panels.value.find((panel) => panel.id === panelParam)
      if (found) {
        openTab(panelParam)
      } else {
        activeTabId.value = null
        toast.add({
          closable: true,
          severity: 'warn',
          summary: 'Session not found',
          life: 5000
        })
      }
    }
  }

  // ── Initialise panels from localStorage ──
  const initializePanels = () => {
    const meta = loadPanelsWithMeta()
    localStorageAvailable.value = meta.localStorageAvailable

    if (!meta.localStorageAvailable) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'localStorage unavailable',
        detail: 'Custom sessions cannot be saved. Only predefined sessions are available.',
        life: 5000
      })
    }

    if (meta.discardedCount > 0) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: `${meta.discardedCount} invalid session${meta.discardedCount > 1 ? 's were' : ' was'} discarded`,
        life: 5000
      })
    }

    let loadedPanels = meta.panels.map((panel) => {
      const migrated = migrateLegacyDataset(panel)
      if (!Array.isArray(migrated.charts) || migrated.charts.length === 0) return migrated
      const validCharts = filterValidCharts(migrated.charts)
      return { ...migrated, charts: validCharts }
    })

    loadedPanels = loadedPanels.filter((panel) => {
      const hasValidCharts = Array.isArray(panel.charts) && panel.charts.length > 0
      const hasEventsConfig = panel.eventsConfig != null
      return hasValidCharts || hasEventsConfig
    })

    panels.value = loadedPanels

    restoreTabs()
    handleShareImport()
    readPanelFromUrl()
  }

  return {
    // State
    activePanel, // alias for activeTabId (backwards-compat)
    activeTabId,
    openTabs,
    panels,
    sessionBrowserVisible,
    sessionCreatorVisible,
    editingPanel,
    localStorageAvailable,
    availableReports,
    activePanelConfig,
    pendingShareViewState,
    // Tab management
    openTab,
    closeTab,
    setActiveTab,
    selectPanel, // alias for openTab
    // Session CRUD
    openSessionCreator,
    handleSessionSave,
    editSession,
    deleteSession,
    // Sharing
    shareCurrentView,
    // Lifecycle
    initializePanels
  }
}
