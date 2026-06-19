import { computed, ref, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useVersionContext } from '@/composables/versioning/use-version-context'
import { VERSION_STATES } from '@/composables/versioning/version-machine'
import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'

// Builds the `resourceContext` consumed by the shared VersionHeadingActions'
// DeployDrawerBlock for an Edge Firewall: resourceId/name + the ready versions
// (deployable) pre-filled from the current version.
export function useFirewallDeployContext() {
  const route = useRoute()
  const { version } = useVersionContext()

  const firewall = inject('edgeFirewall', ref(null))
  const resourceId = computed(() => Number(firewall.value?.id ?? route.params.id))
  const resourceName = computed(() => firewall.value?.name ?? '')

  const versionsQuery = edgeFirewallVersionService.useListVersionsQuery(resourceId.value)
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
    rawVersions.value.filter((item) => item.state === VERSION_STATES.READY).map(toVersionOption)
  )

  const versionOptions = computed(() => {
    if (readyVersionOptions.value.length) return readyVersionOptions.value
    if (!version.value?.id) return []
    return [toVersionOption({ ...version.value, isCurrent: true })]
  })

  const resourceContext = computed(() => ({
    resourceType: 'firewall',
    resourceId: resourceId.value,
    resourceName: resourceName.value,
    version: version.value?.id ? { id: version.value.id } : null,
    versions: versionOptions.value
  }))

  return { resourceContext }
}
