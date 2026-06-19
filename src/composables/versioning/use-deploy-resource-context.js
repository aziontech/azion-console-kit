import { computed, inject, ref, toValue } from 'vue'
import { useRoute } from 'vue-router'
import { toDeployableVersionOptions, toVersionOption } from './to-version-options'

/**
 * useDeployResourceContext — builds the `resourceContext` consumed by the shared
 * VersionHeadingActions' DeployDrawerBlock. Shared by every deployable resource
 * (Application / Custom Page / Firewall); specializes via config only.
 *
 * The resource (for id/name) is read from the editor's `provide`d ref under
 * `injectionKey`; the deployable versions come from the resource's version list.
 *
 * `currentVersionId` (the version being edited) is passed in from the host's props
 * — NOT injected from the version context — because this composable runs in the
 * host's setup, which is OUTSIDE the VersionShell that provides that context.
 *
 * @param {{ resourceType: string, injectionKey: string, versionService: object,
 *   currentVersionId?: import('vue').Ref<string>|(() => string)|string }} config
 */
export function useDeployResourceContext({
  resourceType,
  injectionKey,
  versionService,
  currentVersionId
}) {
  const route = useRoute()

  const resource = inject(injectionKey, ref(null))
  const resourceId = computed(() => Number(resource.value?.id ?? route.params.id))
  const resourceName = computed(() => resource.value?.name ?? '')
  const currentId = computed(() => toValue(currentVersionId) ?? null)

  const versionsQuery = versionService.useListVersionsQuery(resourceId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const readyVersionOptions = computed(() =>
    toDeployableVersionOptions(rawVersions.value, currentId.value)
  )

  // Fallback: with no deployable versions, show the current version alone (enriched
  // from the list when present) so the drawer is never empty mid-edit.
  const versionOptions = computed(() => {
    if (readyVersionOptions.value.length) return readyVersionOptions.value
    if (!currentId.value) return []
    const current = rawVersions.value.find((item) => item.id === currentId.value)
    return [toVersionOption(current ?? { id: currentId.value }, currentId.value)]
  })

  const resourceContext = computed(() => ({
    resourceType,
    resourceId: resourceId.value,
    resourceName: resourceName.value,
    version: currentId.value ? { id: currentId.value } : null,
    versions: versionOptions.value
  }))

  return { resourceContext }
}
