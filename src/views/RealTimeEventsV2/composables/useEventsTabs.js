import { ref } from 'vue'
import { MAX_TOTAL_TABS } from './useTabLimit.js'

/**
 * localStorage key for persisting additional Events tabs.
 * Distinct from 'rte:open-tabs' which holds Dashboard panel ids.
 */
const EVENTS_TABS_STORAGE_KEY = 'rte:open-events-tabs'

/**
 * Generate a stable, namespaced tab id.
 * Uses crypto.randomUUID when available, falls back to Math.random.
 *
 * @returns {string}  e.g. 'events:550e8400-e29b-41d4-a716-446655440000'
 */
function generateTabId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `events:${crypto.randomUUID()}`
  }
  return `events:${Math.random().toString(36).slice(2)}`
}

/**
 * Predicate — returns true for additional Events tab ids (those starting with
 * 'events:'). The pinned Events tab has id === null; Dashboard tabs have
 * arbitrary string ids that do not start with 'events:'.
 *
 * @param {string|null} id
 * @returns {boolean}
 */
export function isEventsTabId(id) {
  return id !== null && typeof id === 'string' && id.startsWith('events:')
}

/**
 * Compute the default label for a new Events tab.
 * Produces 'Events (N)' where N is the smallest positive integer >= 2 such
 * that the label is not already in use among the currently open Events tabs.
 *
 * @param {Array<{label: string}>} currentTabs
 * @returns {string}
 */
function computeDefaultLabel(currentTabs) {
  const usedLabels = new Set(currentTabs.map((tab) => tab.label))
  let num = 2
  while (usedLabels.has(`Events (${num})`)) {
    num++
  }
  return `Events (${num})`
}

/**
 * Manages additional Events tabs (not the pinned first tab, not Dashboard tabs).
 *
 * @param {Object} options
 * @param {Object} options.toast                                    – PrimeVue toast service
 * @param {() => number} options.totalTabCount                      – injected from useTabLimit
 * @param {import('vue').Ref<string|null>} options.activeTabId      – shared with useSessionManager
 * @returns {{
 *   eventsTabs: import('vue').Ref<Array<{id: string, label: string, dataset: string}>>,
 *   openEventsTab: (opts?: {label?: string, dataset?: string, viewState?: Object}) => string|null,
 *   closeEventsTab: (tabId: string) => void,
 *   renameEventsTab: (tabId: string, label: string) => void,
 *   restoreEventsTabs: () => void,
 *   persistEventsTabs: () => void,
 *   getPendingViewState: (tabId: string) => Object|null,
 *   isEventsTabId: (id: string|null) => boolean
 * }}
 */
export function useEventsTabs({ toast, totalTabCount, activeTabId }) {
  /**
   * Reactive list of additional Events tabs (excludes the pinned first tab).
   * Each entry: { id: 'events:<uuid>', label: string, dataset: string }
   */
  const eventsTabs = ref([])

  /**
   * Per-tab pending view state map.
   * Populated by openEventsTab when opts.viewState is provided (e.g. from
   * Share_State import). Consumed once by TabPanelBlock on mount via
   * getPendingViewState, then cleared.
   *
   * @type {Map<string, Object>}
   */
  const pendingViewStateMap = new Map()

  // ── Debounced persistence ──────────────────────────────────────────────────

  let _persistTimer = null

  /**
   * Write the current eventsTabs list to localStorage, debounced 100 ms.
   * Only persists { id, label, dataset } — never filterData or other state.
   */
  function persistEventsTabs() {
    if (_persistTimer !== null) {
      clearTimeout(_persistTimer)
    }
    _persistTimer = setTimeout(() => {
      _persistTimer = null
      try {
        const payload = eventsTabs.value.map(({ id, label, dataset }) => ({ id, label, dataset }))
        localStorage.setItem(EVENTS_TABS_STORAGE_KEY, JSON.stringify(payload))
      } catch {
        // localStorage unavailable — silently ignore
      }
    }, 100)
  }

  // ── Restore from localStorage ──────────────────────────────────────────────

  /**
   * Read and restore additional Events tabs from localStorage.
   * Silently returns [] on any parse error or non-array value (Requirement 2.4).
   * Limits restored tabs to MAX_TOTAL_TABS - 1 entries.
   */
  function restoreEventsTabs() {
    try {
      const raw = localStorage.getItem(EVENTS_TABS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      const limited = parsed.slice(0, MAX_TOTAL_TABS - 1)
      // Only restore entries that have the required shape
      const valid = limited.filter(
        (entry) =>
          entry &&
          typeof entry.id === 'string' &&
          isEventsTabId(entry.id) &&
          typeof entry.label === 'string' &&
          entry.label.trim() !== '' &&
          typeof entry.dataset === 'string'
      )
      eventsTabs.value = valid.map(({ id, label, dataset }) => ({ id, label, dataset }))
    } catch {
      // Malformed JSON or unavailable storage — silently fall back to []
    }
  }

  // ── canOpenNewTab ──────────────────────────────────────────────────────────

  /**
   * Returns true when the total number of open tabs (across all kinds) is
   * below MAX_TOTAL_TABS.
   *
   * @returns {boolean}
   */
  function canOpenNewTab() {
    return totalTabCount() < MAX_TOTAL_TABS
  }

  // ── Tab lifecycle ──────────────────────────────────────────────────────────

  /**
   * Open a new additional Events tab.
   *
   * @param {Object} [opts={}]
   * @param {string} [opts.label]      – explicit label; defaults to 'Events (N)'
   * @param {string} [opts.dataset]    – dataset key; defaults to 'httpRequests'
   * @param {Object} [opts.viewState]  – pending view state to seed the new TabPanelBlock
   * @returns {string|null}  the new tab id, or null when the limit is reached
   */
  function openEventsTab(opts = {}) {
    if (!canOpenNewTab()) {
      toast.add({
        severity: 'warn',
        summary: `Tab limit reached (${MAX_TOTAL_TABS}). Close a tab before opening another one.`,
        closable: true,
        life: 4000
      })
      return null
    }

    const id = generateTabId()
    const label = opts.label ?? computeDefaultLabel(eventsTabs.value)
    const dataset = opts.dataset ?? 'httpRequests'

    eventsTabs.value = [...eventsTabs.value, { id, label, dataset }]

    if (opts.viewState !== undefined && opts.viewState !== null) {
      pendingViewStateMap.set(id, opts.viewState)
    }

    activeTabId.value = id
    persistEventsTabs()

    return id
  }

  /**
   * Close an additional Events tab.
   * If the closed tab was active, activates the tab immediately to its left
   * within the eventsTabs list, or falls back to null (the pinned Events tab).
   *
   * @param {string} tabId
   */
  function closeEventsTab(tabId) {
    const idx = eventsTabs.value.findIndex((tab) => tab.id === tabId)
    if (idx === -1) return

    const wasActive = activeTabId.value === tabId

    eventsTabs.value = eventsTabs.value.filter((tab) => tab.id !== tabId)

    if (wasActive) {
      if (idx > 0) {
        // Activate the tab that was immediately to the left
        activeTabId.value = eventsTabs.value[idx - 1]?.id ?? null
      } else {
        // The closed tab was the first additional tab — fall back to pinned
        activeTabId.value = null
      }
    }

    // Clean up any pending view state for the closed tab
    pendingViewStateMap.delete(tabId)

    persistEventsTabs()
  }

  /**
   * Rename an additional Events tab.
   * Trims the label; silently rejects empty or whitespace-only labels.
   *
   * @param {string} tabId
   * @param {string} label
   */
  function renameEventsTab(tabId, label) {
    const trimmed = typeof label === 'string' ? label.trim() : ''
    if (trimmed === '') return

    const idx = eventsTabs.value.findIndex((tab) => tab.id === tabId)
    if (idx === -1) return

    const updated = [...eventsTabs.value]
    updated[idx] = { ...updated[idx], label: trimmed }
    eventsTabs.value = updated

    persistEventsTabs()
  }

  // ── Pending view state ─────────────────────────────────────────────────────

  /**
   * Retrieve and consume the pending view state for a tab.
   * Returns the stored viewState and immediately removes it from the map so
   * it is consumed exactly once (by TabPanelBlock on mount).
   *
   * @param {string} tabId
   * @returns {Object|null}
   */
  function getPendingViewState(tabId) {
    if (!pendingViewStateMap.has(tabId)) return null
    const state = pendingViewStateMap.get(tabId)
    pendingViewStateMap.delete(tabId)
    return state
  }

  return {
    eventsTabs,
    openEventsTab,
    closeEventsTab,
    renameEventsTab,
    restoreEventsTabs,
    persistEventsTabs,
    getPendingViewState,
    isEventsTabId
  }
}
