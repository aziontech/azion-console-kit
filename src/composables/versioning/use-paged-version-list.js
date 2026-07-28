import { computed, getCurrentScope, onScopeDispose, ref, toValue, watch } from 'vue'
import { buildVersionListOptions } from '@/composables/versioning/use-version-list'
import { useTablePageSize } from '@/composables/useTablePageSize'
import {
  VERSION_POLL_INTERVAL_MS,
  hasTransientVersions
} from '@/services/v2/versioning/version-cache-policy'

export function usePagedVersionList({ versionService, resourceId, activeVersions }) {
  const { pageSize, setPageSize } = useTablePageSize()

  const page = ref(1)
  const paginatorFirst = ref(0)
  const rows = ref([])
  const totalRecords = ref(0)
  const isLoading = ref(true)
  const isError = ref(false)
  const hasAnyVersions = computed(() => totalRecords.value > 0)

  let pollTimer = null
  let latestRequestId = 0

  const stopPolling = () => {
    if (!pollTimer) return
    clearInterval(pollTimer)
    pollTimer = null
  }

  const syncPolling = () => {
    if (!hasTransientVersions({ body: rows.value })) {
      stopPolling()
      return
    }
    if (pollTimer) return
    pollTimer = setInterval(() => load({ skipCache: true, silent: true }), VERSION_POLL_INTERVAL_MS)
  }

  const load = async ({ skipCache = false, silent = false } = {}) => {
    const id = toValue(resourceId)
    if (id == null || id === '') {
      rows.value = []
      totalRecords.value = 0
      isLoading.value = false
      stopPolling()
      return
    }

    if (!silent) isLoading.value = true
    isError.value = false

    const requestId = ++latestRequestId

    try {
      const { body, count } = await versionService.listVersionsPage(id, {
        page: page.value,
        pageSize: pageSize.value,
        skipCache
      })
      if (requestId !== latestRequestId) return
      rows.value = Array.isArray(body) ? body : []
      totalRecords.value = Number.isFinite(count) ? count : rows.value.length
      syncPolling()
    } catch {
      if (requestId !== latestRequestId) return
      stopPolling()
      if (!silent) {
        isError.value = true
        rows.value = []
        totalRecords.value = 0
      }
    } finally {
      if (requestId === latestRequestId) isLoading.value = false
    }
  }

  const items = computed(() => {
    const active = toValue(activeVersions)
    const activeMap = active instanceof Map ? active : null
    if (!activeMap || activeMap.size === 0) return rows.value

    return rows.value.map((version) => {
      const entry = activeMap.get(String(version.id))
      return { ...version, activeTraffic: entry ? { deployments: entry.deployments } : null }
    })
  })

  const { filters, sortOptions } = buildVersionListOptions({ activeVersions })

  const onPage = (event) => {
    setPageSize(event?.rows ?? pageSize.value)
    paginatorFirst.value = event?.first ?? 0
    page.value = Math.floor(paginatorFirst.value / pageSize.value) + 1
    return load()
  }

  const reload = () => {
    paginatorFirst.value = 0
    page.value = 1
    return load({ skipCache: true })
  }

  watch(
    () => toValue(resourceId),
    () => reload(),
    { immediate: true }
  )

  if (getCurrentScope()) onScopeDispose(stopPolling)

  return {
    items,
    totalRecords,
    paginatorFirst,
    pageSize,
    isLoading,
    isError,
    hasAnyVersions,
    filters,
    sortOptions,
    onPage,
    reload,
    stopPolling
  }
}
