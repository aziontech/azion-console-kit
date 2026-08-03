import { ref, computed, watch, toValue } from 'vue'
import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

export function useApplicationVersionReady({ applicationId, versionId, enabled } = {}) {
  const isEnabled = computed(() => Boolean(toValue(enabled) ?? true))
  const currentApplicationId = computed(() => toValue(applicationId) ?? null)
  const currentVersionId = computed(() => toValue(versionId) ?? null)
  const isGated = computed(
    () => isEnabled.value && currentApplicationId.value != null && currentVersionId.value != null
  )

  const isReady = ref(false)
  const isLoading = ref(false)
  const hasError = ref(false)
  const loadedKey = ref(null)

  const load = async (appId, verId) => {
    const key = `${appId}:${verId}`
    if (isLoading.value) return
    if (loadedKey.value === key && !hasError.value) return

    isLoading.value = true
    hasError.value = false
    try {
      const version = await edgeAppVersionService.loadVersion(appId, verId)
      isReady.value = (version?.state ?? version?.version_state) === 'ready'
      loadedKey.value = key
    } catch (error) {
      hasError.value = true
      isReady.value = false
      loadedKey.value = null
      // eslint-disable-next-line no-console
      console.error('useApplicationVersionReady: failed to load application version', error)
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
        isReady.value = false
        hasError.value = false
        loadedKey.value = null
        return
      }
      load(currentApplicationId.value, currentVersionId.value)
    },
    { immediate: true }
  )

  return {
    isReady,
    isLoading,
    hasError,
    retry
  }
}
