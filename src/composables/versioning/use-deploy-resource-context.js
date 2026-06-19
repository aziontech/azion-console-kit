import { computed, inject, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useVersionContext } from './use-version-context'
import { toDeployableVersionOptions, toVersionOption } from './to-version-options'

/**
 * useDeployResourceContext — builds the `resourceContext` consumed by the shared
 * VersionHeadingActions' DeployDrawerBlock. Shared by every deployable resource
 * (Application / Custom Page / Firewall); specializes via config only.
 *
 * The resource (for id/name) is read from the version editor's `provide`d ref under
 * `injectionKey`; the deployable versions come from the resource's version list.
 *
 * @param {{ resourceType: string, injectionKey: string, versionService: object }} config
 */
export function useDeployResourceContext({ resourceType, injectionKey, versionService }) {
  const route = useRoute()
  const { version } = useVersionContext()

  const resource = inject(injectionKey, ref(null))
  const resourceId = computed(() => Number(resource.value?.id ?? route.params.id))
  const resourceName = computed(() => resource.value?.name ?? '')

  const versionsQuery = versionService.useListVersionsQuery(resourceId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const readyVersionOptions = computed(() =>
    toDeployableVersionOptions(rawVersions.value, version.value?.id)
  )

  // Fallback: with no deployable versions, the lone current version always shows
  // (regardless of its state) so the drawer is never empty mid-edit.
  const versionOptions = computed(() => {
    if (readyVersionOptions.value.length) return readyVersionOptions.value
    if (!version.value?.id) return []
    return [toVersionOption(version.value, version.value.id)]
  })

  const resourceContext = computed(() => ({
    resourceType,
    resourceId: resourceId.value,
    resourceName: resourceName.value,
    version: version.value?.id ? { id: version.value.id } : null,
    versions: versionOptions.value
  }))

  return { resourceContext }
}
