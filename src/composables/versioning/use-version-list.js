/**
 * Headless list logic for the versions listing (search + status filter + sort).
 *
 * Owns the reactive search/filter/sort state and derives the visible `items`
 * from an already-normalized version array. Decoupling this from the view keeps
 * the SFC declarative and the logic unit-testable.
 *
 * PURE: depends only on `vue` and the version state machine. No services, no
 * stores, no HTTP, no flag reads — callers pass the normalized versions in.
 */

import { ref, computed, toValue } from 'vue'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

/**
 * Human-readable label per canonical version state. Kept in declaration order
 * of `VERSION_STATES` so the status filter stays in sync with the state machine.
 */
const STATE_LABELS = {
  [VERSION_STATES.DRAFT]: 'Draft',
  [VERSION_STATES.QUEUED]: 'Queued',
  [VERSION_STATES.BUILDING]: 'Building',
  [VERSION_STATES.READY]: 'Ready',
  [VERSION_STATES.ACTIVE]: 'Active',
  [VERSION_STATES.ARCHIVED]: 'Archived',
  [VERSION_STATES.CANCELED]: 'Canceled',
  [VERSION_STATES.ERROR]: 'Error'
}

/**
 * Sort comparators keyed by the toolbar's sort value. Each compares two
 * normalized versions; missing keys coerce to '' so the sort stays stable.
 */
const COMPARATORS = {
  'lastModified-desc': (left, right) =>
    String(right.lastModified || '').localeCompare(String(left.lastModified || '')),
  'createdAt-asc': (left, right) =>
    String(left.createdAt || '').localeCompare(String(right.createdAt || '')),
  'state-asc': (left, right) => String(left.state || '').localeCompare(String(right.state || ''))
}

/**
 * @param {import('vue').MaybeRefOrGetter<Array<object>>} rawVersions
 *   Normalized version array (UI shape: `{ id, state, comment, createdAt, lastModified, ... }`).
 * @param {object} [options]
 * @param {string[]} [options.searchableFields] Fields the search term matches against.
 * @param {string} [options.defaultSort] Initial sort value (a `COMPARATORS` key).
 */
export function useVersionList(rawVersions, options = {}) {
  const { searchableFields = ['id', 'state', 'comment'], defaultSort = 'lastModified-desc' } =
    options

  const searchTerm = ref('')
  const filterValues = ref({ state: null })
  const sort = ref(defaultSort)

  const statusOptions = [
    { label: 'All Status', value: null },
    ...Object.values(VERSION_STATES).map((value) => ({ label: STATE_LABELS[value], value }))
  ]

  const sortOptions = [
    { label: 'Last modified', value: 'lastModified-desc' },
    { label: 'First created', value: 'createdAt-asc' },
    { label: 'Status', value: 'state-asc' }
  ]

  const filters = computed(() => [
    {
      key: 'state',
      options: statusOptions,
      placeholder: 'All Status',
      defaultValue: null
    }
  ])

  const items = computed(() => {
    const source = toValue(rawVersions) ?? []
    const term = searchTerm.value.trim().toLowerCase()
    const stateFilter = filterValues.value.state

    const filtered = source.filter((version) => {
      if (stateFilter && version.state !== stateFilter) return false
      if (!term) return true
      const haystack = searchableFields
        .map((field) => version[field])
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })

    const comparator =
      COMPARATORS[sort.value] || COMPARATORS[defaultSort] || COMPARATORS['lastModified-desc']
    return [...filtered].sort(comparator)
  })

  return {
    items,
    searchTerm,
    filterValues,
    sort,
    filters,
    sortOptions,
    statusOptions
  }
}
