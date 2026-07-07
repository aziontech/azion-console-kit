import { ref, computed, unref } from 'vue'
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
import { resolveTabNeighbor } from './utils/resolveTabNeighbor.js'
import { createSessionUrlSync } from './utils/sessionUrlSync.js'
import { useSessionPersistence, migrateLegacyDataset } from './useSessionPersistence.js'

// Single ceiling expressed in terms of NON-PINNED tabs. The pinned Events tab
// (id === null) is always present and never counted here, so the effective
// total ceiling stays MAX_TOTAL_TABS. Used only on the (rare) un-injected
// fallback path — the injected canOpenNewTab predicate is authoritative
// otherwise. There is exactly ONE ceiling value everywhere (req 2.1).
const MAX_NON_PINNED_TABS = MAX_TOTAL_TABS - 1

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
 * @param {import('vue').ComputedRef<boolean>|(() => boolean)|null} [options.canOpenNewTab=null] – injected from useTabLimit (single ceiling-aware source of truth); when provided, it is authoritative for admission. When absent, the fallback counts against the SAME unified ceiling (MAX_TOTAL_TABS). Accepts a computed ref or a getter.
 * @param {((reservedCount?: number) => number)|null}      [options.capForRestore=null] – ceiling-aware restore cap from useTabLimit. When provided, restoration honors the unified ceiling. When absent, the fallback slices against the same MAX_TOTAL_TABS ceiling.
 * @param {(() => number)|null}                            [options.reservedTabCount=null] – getter for tab slots already consumed by OTHER tab kinds (e.g. additional Events tabs) at Dashboard-restore time. Used to keep the unified ceiling correct regardless of restore order. Defaults to 0.
 * @param {import('vue').Ref|null}                         [options.fallbackCopyDialogRef=null] – ref to a `<FallbackCopyDialog>` instance. When clipboard write fails or the Clipboard API is unavailable, the dialog is opened with the share URL so the user can copy it manually. Optional: when omitted (or unwired), a plain error toast is shown instead.
 * @param {(() => Array<{id: (string|null)}>)|null}        [options.combinedTabOrder=null] – getter for the full visual tab order (pinned Events + additional Events + Dashboard). Used by internal close paths (deleteSession) to resolve the correct neighbor across ALL tab kinds, matching the caller-provided nextActiveId path. When absent, close falls back to the openTabs-local left neighbor.
 */
export function useSessionManager({
  route,
  router,
  toast,
  canOpenNewTab = null,
  capForRestore = null,
  reservedTabCount = null,
  fallbackCopyDialogRef = null,
  combinedTabOrder = null
}) {
  const readCombinedTabOrder = () =>
    typeof combinedTabOrder === 'function' ? combinedTabOrder() : null
  // Normalize the injected admission predicate: useTabLimit now exposes a
  // stable computed, but a plain getter is still accepted for compatibility.
  const readCanOpenNewTab = () => {
    if (canOpenNewTab == null) return null
    return typeof canOpenNewTab === 'function' ? canOpenNewTab() : unref(canOpenNewTab)
  }
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

  // ── localStorage persistence (extracted) ──
  const { persistTabs, restoreTabs } = useSessionPersistence({
    openTabs,
    activeTabId,
    panels,
    eventsTab: EVENTS_TAB,
    maxTotalTabs: MAX_TOTAL_TABS,
    capForRestore,
    reservedTabCount
  })

  // ── URL sync helpers (extracted) ──
  const { syncUrlWithPanel, removeQueryParam } = createSessionUrlSync({
    route,
    router,
    activeTabId
  })

  // ── Tab management ──
  /**
   * Single admission gate shared by every "open a new tab" path (openTab and
   * handleShareImport). When the injected canOpenNewTab predicate is present it
   * is authoritative; otherwise we count non-pinned tabs against the SAME
   * unified ceiling (MAX_TOTAL_TABS). Either way the toast reports the one
   * ceiling value, so no divergent number can leak to the user (req 2.1, 2.5).
   *
   * @returns {boolean} true when a new tab may be opened.
   */
  const canAdmitNewTab = () => {
    const admission = readCanOpenNewTab()
    if (admission !== null) return admission
    const nonPinnedCount = openTabs.value.filter((tab) => tab.id !== null).length
    return nonPinnedCount < MAX_NON_PINNED_TABS
  }

  const notifyTabLimitReached = () => {
    toast.add({
      closable: true,
      severity: 'warn',
      summary: `Tab limit reached (${MAX_TOTAL_TABS})`,
      detail: 'Close a tab before opening another one.',
      life: 4000
    })
  }

  const openTab = (panelId) => {
    if (panelId === null || panelId === undefined) {
      activeTabId.value = null
      syncUrlWithPanel()
      persistTabs()
      return
    }
    const alreadyOpen = openTabs.value.some((tab) => tab.id === panelId)
    if (!alreadyOpen) {
      if (!canAdmitNewTab()) {
        notifyTabLimitReached()
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

  /**
   * Close a Dashboard/panel tab and, when it was active, activate a neighbor.
   *
   * Neighbor resolution (req 2.2 / C4): the visual tab bar interleaves the
   * pinned Events tab, additional Events tabs, and Dashboard tabs, but
   * `openTabs` only holds the pinned + Dashboard tabs. Picking a neighbor by an
   * index into that PARTIAL array can activate the wrong tab. The caller (the
   * view) therefore resolves the neighbor from the COMBINED visual order and
   * passes it as `nextActiveId` — an id that may be an `events:*` tab, a
   * Dashboard id, or `null` (the pinned Events tab). When `nextActiveId` is not
   * provided (e.g. internal `deleteSession` calls), we fall back to the
   * openTabs-local left neighbor for backward compatibility.
   *
   * @param {string|null} panelId – id of the tab to close
   * @param {string|null} [nextActiveId] – id to activate when the closed tab was
   *   active; resolved from the combined tab order by the caller. `undefined`
   *   means "not provided" and triggers the local fallback; explicit `null`
   *   means "activate the pinned Events tab".
   */
  const closeTab = (panelId, nextActiveId) => {
    if (panelId === null) return // Events tab is non-closable
    const idx = openTabs.value.findIndex((tab) => tab.id === panelId)
    if (idx <= 0) return
    const wasActive = activeTabId.value === panelId
    openTabs.value = openTabs.value.filter((tab) => tab.id !== panelId)
    if (wasActive) {
      if (nextActiveId !== undefined) {
        // Neighbor resolved from the combined visual order by the caller.
        activeTabId.value = nextActiveId
      } else {
        // Fallback: openTabs-local left neighbor (Events if only Events left).
        const next = openTabs.value[Math.max(0, idx - 1)]
        activeTabId.value = next ? next.id : null
      }
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
      // Close the tab if open. Resolve the neighbor from the COMBINED visual
      // order (same seam TabsView uses for user-driven close) so deleting an
      // active Dashboard tab that sits after additional Events tabs activates
      // the correct neighbor instead of an openTabs-local positional guess
      // (req 2.2 / C4). Falls back to closeTab's local resolution when the
      // combined order is not injected.
      if (openTabs.value.some((tab) => tab.id === panelId)) {
        const order = readCombinedTabOrder()
        const nextActiveId = Array.isArray(order) ? resolveTabNeighbor(order, panelId) : undefined
        closeTab(panelId, nextActiveId)
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
    // Admission honors the SAME unified ceiling as openTab (req 2.5 / bug C7):
    // a shared tab must not bypass the limit. When the ceiling is reached we do
    // NOT append a new tab — the shared view still round-trips via
    // pendingShareViewState applied to the pinned Events tab below (and a toast
    // tells the user why no tab was opened), mirroring openTab's behavior.
    //
    // `sharedTabRefused` is set ONLY when a genuinely new shared tab was blocked
    // by the ceiling; the "panel already exists locally" and "no panelConfig"
    // cases keep their original activation semantics untouched.
    let sharedTabRefused = false
    if (decoded.panelConfig) {
      const cfg = decoded.panelConfig
      const exists = panels.value.some((panel) => panel.id === cfg.id)
      if (!exists) {
        if (canAdmitNewTab()) {
          sharedTabState.value = {
            id: cfg.id,
            panelConfig: { ...cfg, type: 'shared' }
          }
          openTabs.value = [
            ...openTabs.value,
            { id: cfg.id, label: cfg.label, icon: cfg.icon, closable: true, shared: true }
          ]
        } else {
          notifyTabLimitReached()
          sharedTabRefused = true
        }
      }
    }

    if (decoded.tab !== undefined) {
      const tabId = decoded.tab
      // When the shared panel tab was refused by the ceiling, do NOT activate a
      // phantom id — fall back to the pinned Events tab so the buffered
      // viewState still lands somewhere visible (consistent with openTab).
      const sharedTabWasRefused =
        sharedTabRefused && decoded.panelConfig && decoded.panelConfig.id === tabId
      if (sharedTabWasRefused) {
        activeTabId.value = null
      } else if (tabId === null || openTabs.value.some((tab) => tab.id === tabId)) {
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
