import { ref, computed, watch, toValue } from 'vue'
import { edgeFirewallRulesEngineService } from '@/services/v2/edge-firewall/edge-firewall-rules-engine-service'

const dedupeDependencies = (dependencies) => {
  const byNetworkListId = new Map()
  for (const dependency of Array.isArray(dependencies) ? dependencies : []) {
    const networkListId = dependency?.networkListId
    if (networkListId === null || networkListId === undefined) continue
    const previous = byNetworkListId.get(networkListId)
    byNetworkListId.set(networkListId, {
      networkListId,
      ruleCount: (previous?.ruleCount ?? 0) + (dependency?.ruleCount ?? 0)
    })
  }
  return [...byNetworkListId.values()]
}

export function useFirewallNetworkListDependencies({ firewallId, versionId, enabled } = {}) {
  const isEnabled = computed(() => Boolean(toValue(enabled) ?? true))
  const currentFirewallId = computed(() => toValue(firewallId) ?? null)
  const currentVersionId = computed(() => toValue(versionId) ?? null)
  const isGated = computed(
    () => isEnabled.value && currentFirewallId.value != null && currentVersionId.value != null
  )

  const networkListDependencies = ref([])
  const isLoading = ref(false)
  const hasError = ref(false)
  const loadedKey = ref(null)

  const resetState = () => {
    networkListDependencies.value = []
    hasError.value = false
    loadedKey.value = null
  }

  const load = async (fwId, verId) => {
    const key = `${fwId}:${verId}`
    if (isLoading.value) return
    if (loadedKey.value === key && !hasError.value) return

    isLoading.value = true
    hasError.value = false
    try {
      const dependencies =
        await edgeFirewallRulesEngineService.listNetworkListDependenciesByVersion(fwId, verId)
      networkListDependencies.value = dedupeDependencies(dependencies)
      loadedKey.value = key
    } catch (error) {
      hasError.value = true
      networkListDependencies.value = []
      loadedKey.value = null
      // eslint-disable-next-line no-console
      console.error(
        'useFirewallNetworkListDependencies: failed to load network list dependencies',
        error
      )
    } finally {
      isLoading.value = false
    }
  }

  const retry = () => {
    if (!isGated.value) return
    loadedKey.value = null
    hasError.value = false
    return load(currentFirewallId.value, currentVersionId.value)
  }

  watch(
    () =>
      `${isGated.value ? '1' : '0'}:${currentFirewallId.value ?? ''}:${currentVersionId.value ?? ''}`,
    () => {
      if (!isGated.value) {
        resetState()
        return
      }
      load(currentFirewallId.value, currentVersionId.value)
    },
    { immediate: true }
  )

  return {
    networkListDependencies,
    isLoading,
    hasError,
    retry
  }
}
