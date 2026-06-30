import { ref, computed, watch, toValue } from 'vue'
import { edgeApplicationFunctionService } from '@/services/v2/edge-app/edge-application-functions-service'

const dedupeDependencies = (dependencies) => {
  const byFunctionId = new Map()
  for (const dependency of Array.isArray(dependencies) ? dependencies : []) {
    const functionId = dependency?.functionId
    if (functionId === null || functionId === undefined) continue
    const previous = byFunctionId.get(functionId)
    byFunctionId.set(functionId, {
      functionId,
      instanceCount: (previous?.instanceCount ?? 0) + (dependency?.instanceCount ?? 0)
    })
  }
  return [...byFunctionId.values()]
}

export function useApplicationFunctionDependencies({ applicationId, versionId, enabled } = {}) {
  const isEnabled = computed(() => Boolean(toValue(enabled) ?? true))
  const currentApplicationId = computed(() => toValue(applicationId) ?? null)
  const currentVersionId = computed(() => toValue(versionId) ?? null)
  const isGated = computed(
    () => isEnabled.value && currentApplicationId.value != null && currentVersionId.value != null
  )

  const functionDependencies = ref([])
  const isLoading = ref(false)
  const hasError = ref(false)
  const loadedKey = ref(null)

  const resetState = () => {
    functionDependencies.value = []
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
      const dependencies = await edgeApplicationFunctionService.listFunctionDependenciesByVersion(
        appId,
        verId
      )
      functionDependencies.value = dedupeDependencies(dependencies)
      loadedKey.value = key
    } catch (error) {
      hasError.value = true
      functionDependencies.value = []
      loadedKey.value = null
      // eslint-disable-next-line no-console
      console.error(
        'useApplicationFunctionDependencies: failed to load function dependencies',
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
    functionDependencies,
    isLoading,
    hasError,
    retry
  }
}
