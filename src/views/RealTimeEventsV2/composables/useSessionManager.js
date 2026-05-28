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
import { MAX_TOTAL_TABS } from './useTabLimit.js'

// Kept for backward compatibility — when canOpenNewTab is not injected,
// fall back to the old per-type limit.
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
  imageProcessedEvents: 'imagesProcessedEvents',
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
 * @param {import('vue-router').RouteLocationNormalized} options.route         – current route
 * @param {import('vue-router').Router}                  options.router        – router instance
 * @param {Object}                                        options.toast         – PrimeVue toast service
 * @param {(() => boolean)|null}                          [options.canOpenNewTab=null] – injected from useTabLimit; when provided, replaces the per-type MAX_OPEN_TABS check
 * @param {import('vue').Ref|null}                         [options.fallbackCopyDialogRef=null] – ref to a `<FallbackCopyDialog>` instance. When clipboard write fails or the Clipboard API is unavailable, the dialog is opened with the share URL so the user can copy it manually. Optional: when omitted (or unwired), a plain error toast is shown instead.
 */
export function useSessionManager({
  route,
  router,
  toast,
  canOpenNewTab = null,
  fallbackCopyDialogRef = null
}) {
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
      const limitReached = canOpenNewTab ? !canOpenNewTab() : extraCount >= MAX_OPEN_TABS
      if (limitReached) {
        toast.add({
          closable: true,
          severity: 'warn',
          summary: canOpenNewTab
            ? `Tab limit reached (${MAX_TOTAL_TABS})`
            : `Tab limit reached (${MAX_OPEN_TABS})`,
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

  // ── Synchronise activeTabId when an additional Events tab is closed externally ──
  /**
   * Synchronise activeTabId when an additional Events tab is closed externally.
   * Called by useEventsTabs.closeEventsTab when the closed tab was active.
   *
   * @param {string} tabId - The id of the tab being closed.
   */
  const removeEventsTabFromActive = (tabId) => {
    if (activeTabId.value !== tabId) return
    // Fall back to the pinned Events tab
    activeTabId.value = null
    syncUrlWithPanel()
  }

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
   *
   * Async by design: the clipboard write is **awaited** so the success
   * toast only fires after the OS clipboard actually holds the URL. The
   * previous fire-and-forget implementation was a race against the
   * promise — users could see the success toast while the write was
   * still pending (or had silently failed in some browsers).
   *
   * Failure path:
   *   1. If the Clipboard API is unavailable or the page is not in a
   *      secure context, we **throw before attempting** the write — that
   *      keeps the error path deterministic instead of relying on
   *      browser-specific rejection messages.
   *   2. In the catch block, if a `fallbackCopyDialogRef` was wired, we
   *      open the dialog with the URL so the user can copy it by hand
   *      (PrimeVue `InputText[readonly]` + execCommand legacy path).
   *   3. Only when no fallback is wired do we surface a destructive
   *      error toast — otherwise the user already has a working path.
   *
   * @param {object}      [options]
   * @param {object}      [options.viewState]  - { filters, tsRange, dataset, pageSize, selectedFields, documentQuery, selectedView }
   * @param {object|null} [options.eventsTab]  - { id, label, dataset } for additional Events tabs; null for pinned/Dashboard tabs
   * @returns {Promise<void>}
   * @requires Requirements 1.1, 1.3, 1.4, N.1, N.8, N.9
   */
  const shareCurrentView = async ({ viewState = {}, eventsTab = null } = {}) => {
    // `url` is declared in the outer scope so the catch block can pass
    // it to the fallback dialog even when the failure happens after the
    // URL has been built.
    let url = null
    try {
      const state = {
        tab: activeTabId.value,
        viewState
      }
      // Include eventsTab only when it is non-null (backward-compatible: omitting
      // it keeps the encoded payload byte-identical to the pre-extension output).
      if (eventsTab !== null && eventsTab !== undefined) {
        state.eventsTab = eventsTab
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
      url = new URL(window.location.href)
      url.searchParams.delete('panel')
      url.searchParams.delete('panelConfig')
      url.searchParams.set('shareState', encoded)

      // Feature-detect clipboard availability before attempting the write.
      // Both checks are required: `navigator.clipboard` exists in some
      // non-secure contexts but throws on write; `isSecureContext` is
      // false on http:// origins (except localhost) and inside some
      // sandboxed iframes.
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error('Clipboard API unavailable')
      }

      // AWAIT — the toast must only fire once the OS clipboard has
      // accepted the write. Browsers may reject the promise (denied
      // permission, transient failure) and we want the catch to handle
      // it consistently.
      await navigator.clipboard.writeText(url.toString())

      const urlString = url.toString()
      // Structured log for observability (N.9). Kept at info level so
      // it lands in browser console / forwarded sinks without alerting
      // on the failure path.
      // eslint-disable-next-line no-console
      console.info({
        event: 'share_url_copied',
        success: true,
        timestamp: Date.now(),
        url_length: urlString.length
      })

      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Share URL copied to clipboard',
        life: 3000
      })
    } catch (err) {
      // Fallback dialog path: when the parent wired a `FallbackCopyDialog`,
      // surface it so the user can still complete the share manually
      // (Ctrl/Cmd+C or the dialog's own legacy execCommand button).
      const dialog = fallbackCopyDialogRef?.value
      const urlString = url ? url.toString() : ''
      if (dialog && typeof dialog.show === 'function' && urlString) {
        try {
          dialog.show(urlString)
          toast.add({
            closable: true,
            severity: 'info',
            summary: 'URL opened for manual copy',
            life: 4000
          })
          return
        } catch {
          // Fall through to error toast below if the dialog itself
          // failed to open (shouldn't happen, but defensive).
        }
      }

      // eslint-disable-next-line no-console
      console.error({
        event: 'share_url_copy_failed',
        error: String(err),
        timestamp: Date.now()
      })
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

  /**
   * Pending eventsTab state decoded from a Share_State URL.
   * Set when the decoded payload contains an `eventsTab` field.
   * TabsView.vue watches this ref and calls openEventsTab / applies viewState
   * to the pinned tab depending on canOpenNewTab().
   *
   * Shape: { label, dataset, viewState } | null
   */
  const pendingEventsTabState = ref(null)

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

    // Handle eventsTab from Share_State (Requirement 4.2, 4.3)
    if (decoded.eventsTab) {
      // Store the eventsTab info for TabsView to consume.
      // TabsView decides whether to open a new tab (canOpenNewTab()) or apply
      // viewState to the pinned Events tab (limit reached). This avoids a
      // circular dependency between useSessionManager and useEventsTabs.
      pendingEventsTabState.value = {
        ...decoded.eventsTab,
        viewState: decoded.viewState ?? {}
      }
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
    pendingEventsTabState,
    // Tab management
    openTab,
    closeTab,
    setActiveTab,
    selectPanel, // alias for openTab
    removeEventsTabFromActive,
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
