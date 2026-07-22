import { ref, computed, toValue } from 'vue'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

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

const COMPARATORS = {
  'lastModified-desc': (left, right) =>
    String(right.lastModified || '').localeCompare(String(left.lastModified || '')),
  'createdAt-asc': (left, right) =>
    String(left.createdAt || '').localeCompare(String(right.createdAt || '')),
  'state-asc': (left, right) => String(left.state || '').localeCompare(String(right.state || ''))
}

/**
 * @param {import('vue').MaybeRefOrGetter<Array<object>>} rawVersions
 * @param {object} [options]
 * @param {string[]} [options.searchableFields]
 * @param {string} [options.defaultSort]
 * @param {import('vue').MaybeRefOrGetter<Map<string, {deployments: Array<object>}>>} [options.activeVersions]
 */
export function useVersionList(rawVersions, options = {}) {
  const {
    searchableFields = ['id', 'state', 'comment'],
    defaultSort = 'lastModified-desc',
    activeVersions
  } = options

  const searchTerm = ref('')
  const filterValues = ref({ state: null, traffic: null })
  const sort = ref(defaultSort)

  const statusOptions = [
    { label: 'All Status', value: null },
    ...Object.values(VERSION_STATES).map((value) => ({ label: STATE_LABELS[value], value }))
  ]

  const trafficOptions = [
    { label: 'All Traffic', value: null },
    { label: 'Receiving traffic', value: 'active' }
  ]

  const sortOptions = [
    { label: 'Last modified', value: 'lastModified-desc' },
    { label: 'First created', value: 'createdAt-asc' },
    { label: 'Status', value: 'state-asc' }
  ]

  const filters = computed(() => {
    const base = [
      {
        key: 'state',
        options: statusOptions,
        placeholder: 'All Status',
        defaultValue: null
      }
    ]

    const active = toValue(activeVersions)
    if (active instanceof Map && active.size > 0) {
      base.push({
        key: 'traffic',
        options: trafficOptions,
        placeholder: 'All Traffic',
        defaultValue: null
      })
    }

    return base
  })

  const items = computed(() => {
    const source = toValue(rawVersions) ?? []
    const term = searchTerm.value.trim().toLowerCase()
    const stateFilter = filterValues.value.state
    const trafficFilter = filterValues.value.traffic
    const active = toValue(activeVersions)
    const activeMap = active instanceof Map ? active : null

    const isReceivingTraffic = (version) => !!activeMap && activeMap.has(String(version.id))

    const filtered = source.filter((version) => {
      if (stateFilter && version.state !== stateFilter) return false
      if (trafficFilter === 'active' && !isReceivingTraffic(version)) return false
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
    const sorted = [...filtered].sort(comparator)

    if (!activeMap || activeMap.size === 0) return sorted

    return sorted.map((version) => {
      const entry = activeMap.get(String(version.id))
      return { ...version, activeTraffic: entry ? { deployments: entry.deployments } : null }
    })
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
