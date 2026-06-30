import { ref, computed, watch, toValue } from 'vue'
import { rulesEngineService } from '@/services/v2/edge-app/edge-app-rules-engine-service'

const dedupeDependencies = (dependencies) => {
  const byConnectorId = new Map()
  for (const dependency of Array.isArray(dependencies) ? dependencies : []) {
    const connectorId = dependency?.connectorId
    if (connectorId === null || connectorId === undefined) continue
    const previous = byConnectorId.get(connectorId)
    byConnectorId.set(connectorId, {
      connectorId,
      ruleCount: (previous?.ruleCount ?? 0) + (dependency?.ruleCount ?? 0)
    })
  }
  return [...byConnectorId.values()]
}

export function useApplicationConnectorDependencies({ applicationId, versionId, enabled } = {}) {
  const isEnabled = computed(() => Boolean(toValue(enabled) ?? true))
  const currentApplicationId = computed(() => toValue(applicationId) ?? null)
  const currentVersionId = computed(() => toValue(versionId) ?? null)
  const isGated = computed(
    () => isEnabled.value && currentApplicationId.value != null && currentVersionId.value != null
  )

  const connectorDependencies = ref([])
  const isLoading = ref(false)
  const hasError = ref(false)
  const loadedKey = ref(null)

  const resetState = () => {
    connectorDependencies.value = []
    hasError.value = false
    loadedKey.value = null
  }

  const load = async (appId, verId) => {
    const key = `${appId}:${verId}`
    if (isLoading.value) return
    if (loadedKey.value === key && !hasError.value) return

    isLoading.value = true
    hasError.value = false
    try {
      const dependencies = await rulesEngineService.listConnectorDependenciesByVersion(appId, verId)
      connectorDependencies.value = dedupeDependencies(dependencies)
      loadedKey.value = key
    } catch (error) {
      hasError.value = true
      connectorDependencies.value = []
      loadedKey.value = null
      // eslint-disable-next-line no-console
      console.error(
        'useApplicationConnectorDependencies: failed to load connector dependencies',
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
    return load(currentApplicationId.value, currentVersionId.value)
  }

  watch(
    () =>
      `${isGated.value ? '1' : '0'}:${currentApplicationId.value ?? ''}:${currentVersionId.value ?? ''}`,
    () => {
      if (!isGated.value) {
        resetState()
        return
      }
      load(currentApplicationId.value, currentVersionId.value)
    },
    { immediate: true }
  )

  return {
    connectorDependencies,
    isLoading,
    hasError,
    retry
  }
}
