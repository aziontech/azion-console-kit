import { ref, toValue, watch } from 'vue'
import { resourceUsageService } from '@/services/v2/deployment/resource-usage-service'
import { activeVersionsForResource } from '@/composables/versioning/active-versions'

const PAGE_SIZE = 100
const MAX_PAGES = 20

const readRef = (resourceRef) => {
  const value = toValue(resourceRef)
  const resourceType = value?.resourceType ?? null
  const resourceId = value?.resourceId ?? null
  if (!resourceType || resourceId == null || resourceId === '') return null
  return { resourceType, resourceId }
}

export function useActiveVersions(resourceRef) {
  const activeVersions = ref(new Map())

  const fetchRows = async (resource, skipCache) => {
    const rows = []
    let page = 1
    let total = Infinity

    while (page <= MAX_PAGES && rows.length < total) {
      const result = await resourceUsageService.listResourceUsage({
        resourceType: resource.resourceType,
        resourceIds: [resource.resourceId],
        page,
        pageSize: PAGE_SIZE,
        skipCache
      })

      const body = Array.isArray(result?.body) ? result.body : []
      rows.push(...body)
      total = Number.isFinite(result?.count) ? result.count : rows.length

      if (body.length === 0) break
      page += 1
    }

    return rows
  }

  const load = async ({ skipCache = false } = {}) => {
    const resource = readRef(resourceRef)
    if (!resource) {
      activeVersions.value = new Map()
      return
    }

    const rows = await fetchRows(resource, skipCache)
    activeVersions.value = activeVersionsForResource(rows, {
      resource_type: resource.resourceType,
      resource_id: resource.resourceId
    })
  }

  const refresh = () => load({ skipCache: true })

  const isActive = (versionId) => activeVersions.value.has(String(versionId))

  watch(
    () => {
      const resource = readRef(resourceRef)
      return resource ? `${resource.resourceType}:${resource.resourceId}` : null
    },
    () => load(),
    { immediate: true }
  )

  return { activeVersions, isActive, refresh }
}
