import { computed, inject, ref, toValue } from 'vue'
import { useRoute } from 'vue-router'
import { toDeployableVersionOptions, toVersionOption } from './to-version-options'
import { getVersionCapability } from './version-capability'

/**
 * @param {{ resourceType: string, injectionKey: string, versionService: object,
 * currentVersionId?: import('vue').Ref<string>|(() => string)|string }} config
 */
export const VERSION_SELECTION_PAGE_SIZE = 100

export function useDeployResourceContext({
  resourceType,
  injectionKey,
  versionService,
  currentVersionId
}) {
  const route = useRoute()

  const capability = getVersionCapability(resourceType)

  const resource = inject(injectionKey, ref(null))
  const resourceId = computed(() => Number(resource.value?.id ?? route.params.id))
  const resourceName = computed(() => resource.value?.name ?? '')
  const currentId = computed(() => toValue(currentVersionId) ?? null)

  const versionsQuery = versionService.useListVersionsQuery(resourceId.value, {
    pageSize: VERSION_SELECTION_PAGE_SIZE
  })
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const readyVersionOptions = computed(() =>
    toDeployableVersionOptions(rawVersions.value, currentId.value)
  )

  const versionOptions = computed(() => {
    if (readyVersionOptions.value.length) return readyVersionOptions.value
    if (!currentId.value) return []
    const current = rawVersions.value.find((item) => item.id === currentId.value)
    return [toVersionOption(current ?? { id: currentId.value }, currentId.value)]
  })

  const resourceContext = computed(() => {
    if (!capability.canDeploy) return null
    return {
      resourceType,
      resourceId: resourceId.value,
      resourceName: resourceName.value,
      version: currentId.value ? { id: currentId.value } : null,
      versions: versionOptions.value
    }
  })

  return { resourceContext }
}
