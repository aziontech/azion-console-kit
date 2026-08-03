import { ref, computed, watch, toValue } from 'vue'
import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'

export function useCustomPageVersionReady({ customPageId, versionId, enabled } = {}) {
  const isEnabled = computed(() => Boolean(toValue(enabled) ?? true))
  const currentCustomPageId = computed(() => toValue(customPageId) ?? null)
  const currentVersionId = computed(() => toValue(versionId) ?? null)
  const isGated = computed(
    () => isEnabled.value && currentCustomPageId.value != null && currentVersionId.value != null
  )

  const isReady = ref(false)
  const isLoading = ref(false)
  const hasError = ref(false)
  const loadedKey = ref(null)

  const load = async (pageId, verId) => {
    const key = `${pageId}:${verId}`
    if (isLoading.value) return
    if (loadedKey.value === key && !hasError.value) return

    isLoading.value = true
    hasError.value = false
    try {
      const version = await customPageVersionService.loadVersion(pageId, verId)
      isReady.value = (version?.state ?? version?.version_state) === 'ready'
      loadedKey.value = key
    } catch (error) {
      hasError.value = true
      isReady.value = false
      loadedKey.value = null
      // eslint-disable-next-line no-console
      console.error('useCustomPageVersionReady: failed to load custom page version', error)
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
        isReady.value = false
        hasError.value = false
        loadedKey.value = null
        return
      }
      load(currentCustomPageId.value, currentVersionId.value)
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
