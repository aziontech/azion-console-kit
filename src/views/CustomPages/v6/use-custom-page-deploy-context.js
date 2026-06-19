import { computed, ref, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useVersionContext } from '@/composables/versioning/use-version-context'
import { VERSION_STATES } from '@/composables/versioning/version-machine'
import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'

// Builds the `resourceContext` consumed by the shared VersionHeadingActions'
// DeployDrawerBlock for a Custom Page: resourceId/name + the ready (deployable)
// versions pre-filled from the current version.
export function useCustomPageDeployContext() {
  const route = useRoute()
  const { version } = useVersionContext()

  const customPage = inject('customPage', ref(null))
  const resourceId = computed(() => Number(customPage.value?.id ?? route.params.id))
  const resourceName = computed(() => customPage.value?.name ?? '')

  const versionsQuery = customPageVersionService.useListVersionsQuery(resourceId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const toVersionOption = (item) => ({
    id: item.id,
    value: item.id,
    label: item.comment || item.id,
    createdAt: item.createdAt ?? null,
    author: item.lastEditor || 'azion@azion.com',
    isCurrent: item.id === version.value?.id
  })

  const readyVersionOptions = computed(() =>
    rawVersions.value
      .filter((item) => [VERSION_STATES.READY, VERSION_STATES.ACTIVE].includes(item.state))
      .map(toVersionOption)
  )

  const versionOptions = computed(() => {
    if (readyVersionOptions.value.length) return readyVersionOptions.value
    if (!version.value?.id) return []
    return [toVersionOption({ ...version.value, isCurrent: true })]
  })

  const resourceContext = computed(() => ({
    resourceType: 'custom_page',
    resourceId: resourceId.value,
    resourceName: resourceName.value,
    version: version.value?.id ? { id: version.value.id } : null,
    versions: versionOptions.value
  }))

  return { resourceContext }
}
