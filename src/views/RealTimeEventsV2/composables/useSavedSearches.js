import { ref, computed, watch, toRaw } from 'vue'
import safeStructuredClone from '@/helpers/structured-clone'
import { useAccountStore } from '@/stores/account'

const LEGACY_KEY = 'rte-saved-searches'
const KEY_PREFIX = 'rte-saved-searches'
const MAX_SAVED = 50

/**
 * Composable for managing saved searches in localStorage.
 *
 * Each saved search persists the slice of state needed to fully restore a
 * previous exploratory view: `{ id, name, dataset, filterData, selectedColumns,
 * pageSize, selectedFields, description, createdAt, updatedAt }`.
 *
 * Storage is scoped per `client_id:user_id` so saved searches from one
 * tenant / user never appear in another's overlay. The legacy unscoped key
 * (`rte-saved-searches`) is dropped on first load because its contents are
 * contaminated by definition — they may contain searches from any past
 * user/tenant on the same browser.
 *
 * Corrupted entries (missing `id`/`name`, non-string types, etc.) are skipped
 * on load and logged to console; valid siblings still surface in the UI so
 * one bad write never wipes the whole list.
 *
 * When `localStorage` is unavailable (private mode, quota exceeded, denied
 * by the browser) the composable degrades gracefully: in-memory state still
 * works for the session and `localStorageAvailable` flips to `false` so the
 * host can surface a one-shot toast.
 *
 * @param {object} [options]
 * @param {(err: Error) => void} [options.onQuotaExceeded]
 *   Called the first time a write fails because storage is unavailable.
 *   Use it to show a single warning toast — subsequent failures are silent.
 *
 * @returns {{
 *   savedSearches: import('vue').Ref<Array>,
 *   localStorageAvailable: import('vue').Ref<boolean>,
 *   saveSearch: Function,
 *   deleteSearch: Function,
 *   applySearch: Function,
 *   load: Function
 * }}
 */
export function useSavedSearches(options = {}) {
  const { onQuotaExceeded } = options
  const accountStore = useAccountStore()

  const storageKey = computed(() => {
    const clientId = accountStore.account?.client_id
    const userId = accountStore.account?.user_id
    if (!clientId || !userId) return null
    return `${KEY_PREFIX}:${clientId}:${userId}`
  })

  const savedSearches = ref([])
  const localStorageAvailable = ref(true)
  // Ensures the host receives the warning toast at most once per composable
  // lifetime, even if multiple writes fail back-to-back.
  let quotaToastFired = false

  /**
   * Validate a single persisted entry. Returns `true` only when the entry
   * has the minimum shape required to be useful in the UI (id, name,
   * dataset, and the filterData/selectedColumns slots, even if empty).
   * Anything missing or of the wrong type is treated as corrupted.
   */
  function isValidEntry(entry) {
    if (!entry || typeof entry !== 'object') return false
    if (typeof entry.id !== 'string' || !entry.id) return false
    if (typeof entry.name !== 'string' || !entry.name.trim()) return false
    if (typeof entry.dataset !== 'string') return false
    // `filterData` is allowed to be null (empty search) but must be
    // either null or a plain object — never a primitive.
    if (entry.filterData !== null && typeof entry.filterData !== 'object') return false
    // `selectedColumns` must be an array if present.
    if (entry.selectedColumns !== undefined && !Array.isArray(entry.selectedColumns)) return false
    return true
  }

  function load() {
    if (!storageKey.value) return []
    let raw
    try {
      raw = localStorage.getItem(storageKey.value)
    } catch (err) {
      // Read access denied (e.g. SecurityError in some sandboxed contexts).
      localStorageAvailable.value = false
      // eslint-disable-next-line no-console
      console.error('useSavedSearches: failed to read localStorage', err)
      return []
    }
    if (!raw) return []
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('useSavedSearches: corrupted root payload, dropping', err)
      return []
    }
    if (!Array.isArray(parsed)) return []

    const valid = []
    let skipped = 0
    for (const entry of parsed) {
      if (isValidEntry(entry)) {
        valid.push(entry)
      } else {
        skipped += 1
        // eslint-disable-next-line no-console
        console.warn('useSavedSearches: skipping corrupted entry', entry)
      }
    }
    if (skipped > 0) {
      // eslint-disable-next-line no-console
      console.info(`useSavedSearches: loaded ${valid.length} entries, skipped ${skipped}`)
    }
    return valid
  }

  function persist() {
    if (!storageKey.value) return
    try {
      localStorage.setItem(storageKey.value, JSON.stringify(savedSearches.value))
    } catch (err) {
      // QuotaExceededError, SecurityError, or any other write rejection
      // means we cannot persist this session. We keep the in-memory copy
      // so the current tab still works, but flip the flag and notify the
      // host once so it can surface a toast.
      localStorageAvailable.value = false
      // eslint-disable-next-line no-console
      console.error('useSavedSearches: failed to persist', err)
      if (!quotaToastFired && typeof onQuotaExceeded === 'function') {
        quotaToastFired = true
        try {
          onQuotaExceeded(err)
        } catch (cbErr) {
          // Never let a callback explosion bring down the composable.
          // eslint-disable-next-line no-console
          console.error('useSavedSearches: onQuotaExceeded callback threw', cbErr)
        }
      }
    }
  }

  // Drop the legacy unscoped key — see useQueryHistory for rationale.
  try {
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // ignore
  }

  watch(
    storageKey,
    (key) => {
      savedSearches.value = key ? load() : []
    },
    { immediate: true }
  )

  /**
   * Save a new search. No-op if account context is missing.
   *
   * @param {object} params
   * @param {string} params.name - User-chosen name (required, trimmed).
   * @param {object|null} params.filterData - Full filterData object (fields, tsRange, etc.).
   * @param {string[]} [params.selectedColumns] - Column field names visible in the table.
   * @param {string} [params.dataset] - Current dataset identifier.
   * @param {number} [params.pageSize] - Page size at save time (restored on apply).
   * @param {string[]} [params.selectedFields] - Sidebar-selected fields (kept as alias of selectedColumns when both differ).
   * @param {string} [params.description] - Optional free-form description.
   * @returns {object|undefined} the persisted entry, or `undefined` when the save was skipped.
   */
  function saveSearch({
    name,
    filterData,
    selectedColumns,
    dataset,
    pageSize,
    selectedFields,
    description
  }) {
    if (!name || !name.trim()) return
    if (!storageKey.value) return

    const now = Date.now()
    const entry = {
      id: now.toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      filterData: filterData ? safeStructuredClone(filterData) : null,
      selectedColumns: Array.isArray(selectedColumns) ? selectedColumns : [],
      // selectedFields is the V2 spec alias — preserve it explicitly when the
      // caller provided a different array (e.g. sidebar selections vs.
      // visible columns). Otherwise fall back to selectedColumns for parity.
      selectedFields: Array.isArray(selectedFields)
        ? selectedFields
        : Array.isArray(selectedColumns)
          ? [...selectedColumns]
          : [],
      dataset: dataset || '',
      pageSize: Number.isFinite(pageSize) ? pageSize : null,
      description: typeof description === 'string' ? description : '',
      createdAt: now,
      updatedAt: now
    }

    savedSearches.value.unshift(entry)

    if (savedSearches.value.length > MAX_SAVED) {
      savedSearches.value = savedSearches.value.slice(0, MAX_SAVED)
    }

    persist()
    // N.10: log CRUD ops for debugging persistence issues.
    // eslint-disable-next-line no-console
    console.info('useSavedSearches: save', { id: entry.id, name: entry.name })
    return entry
  }

  function deleteSearch(id) {
    const before = savedSearches.value.length
    savedSearches.value = savedSearches.value.filter((search) => search.id !== id)
    if (savedSearches.value.length !== before) {
      persist()
      // eslint-disable-next-line no-console
      console.info('useSavedSearches: delete', { id })
    }
  }

  /**
   * Return a deep clone of the entry so callers can mutate the result
   * (e.g. patch `filterData.fields`) without corrupting the in-memory list.
   * Returns `null` when the entry was not found.
   */
  function applySearch(id) {
    const entry =
      typeof id === 'string' ? savedSearches.value.find((search) => search.id === id) : id
    if (!entry) return null
    // eslint-disable-next-line no-console
    console.info('useSavedSearches: apply', { id: entry.id, name: entry.name })
    // Strip reactivity before cloning. `structuredClone` rejects Vue
    // reactive proxies (DataCloneError), so we unwrap with `toRaw` first.
    // The clone protects callers — they can mutate without poisoning the
    // in-memory list.
    return safeStructuredClone(toRaw(entry))
  }

  return {
    savedSearches,
    localStorageAvailable,
    saveSearch,
    deleteSearch,
    applySearch,
    load
  }
}
