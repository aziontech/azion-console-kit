import { ref, computed, watch, toValue } from 'vue'
import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'

const dedupeDependencies = (dependencies) => {
  const byConnectorId = new Map()
  for (const dependency of Array.isArray(dependencies) ? dependencies : []) {
    const connectorId = dependency?.connectorId
    if (connectorId === null || connectorId === undefined) continue
    const previous = byConnectorId.get(connectorId)
    byConnectorId.set(connectorId, {
      connectorId,
      pageCount: (previous?.pageCount ?? 0) + (dependency?.pageCount ?? 0)
    })
  }
  return [...byConnectorId.values()]
}

export function useCustomPageConnectorDependencies({ customPageId, versionId, enabled } = {}) {
  const isEnabled = computed(() => Boolean(toValue(enabled) ?? true))
  const currentCustomPageId = computed(() => toValue(customPageId) ?? null)
  const currentVersionId = computed(() => toValue(versionId) ?? null)
  const isGated = computed(
    () => isEnabled.value && currentCustomPageId.value != null && currentVersionId.value != null
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

  const load = async (pageId, verId) => {
    const key = `${pageId}:${verId}`
    if (isLoading.value) return
    if (loadedKey.value === key && !hasError.value) return

    isLoading.value = true
    hasError.value = false
    try {
      const dependencies = await customPageVersionService.listConnectorDependenciesByVersion(
        pageId,
        verId
      )
      connectorDependencies.value = dedupeDependencies(dependencies)
      loadedKey.value = key
    } catch (error) {
      hasError.value = true
      connectorDependencies.value = []
      loadedKey.value = null
      // eslint-disable-next-line no-console
      console.error(
        'useCustomPageConnectorDependencies: failed to load connector dependencies',
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
    return load(currentCustomPageId.value, currentVersionId.value)
  }

  watch(
    () =>
      `${isGated.value ? '1' : '0'}:${currentCustomPageId.value ?? ''}:${currentVersionId.value ?? ''}`,
    () => {
      if (!isGated.value) {
        resetState()
        return
      }
      load(currentCustomPageId.value, currentVersionId.value)
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
