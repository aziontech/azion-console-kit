import { ref, computed, watch, toValue } from 'vue'
import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'

export function useFirewallVersionReady({ firewallId, versionId, enabled } = {}) {
  const isEnabled = computed(() => Boolean(toValue(enabled) ?? true))
  const currentFirewallId = computed(() => toValue(firewallId) ?? null)
  const currentVersionId = computed(() => toValue(versionId) ?? null)
  const isGated = computed(
    () => isEnabled.value && currentFirewallId.value != null && currentVersionId.value != null
  )

  const isReady = ref(false)
  const isLoading = ref(false)
  const hasError = ref(false)
  const loadedKey = ref(null)

  const load = async (fwId, verId) => {
    const key = `${fwId}:${verId}`
    if (isLoading.value) return
    if (loadedKey.value === key && !hasError.value) return

    isLoading.value = true
    hasError.value = false
    try {
      const version = await edgeFirewallVersionService.loadVersion(fwId, verId)
      isReady.value = (version?.state ?? version?.version_state) === 'ready'
      loadedKey.value = key
    } catch (error) {
      hasError.value = true
      isReady.value = false
      loadedKey.value = null
      // eslint-disable-next-line no-console
      console.error('useFirewallVersionReady: failed to load firewall version', error)
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
        isReady.value = false
        hasError.value = false
        loadedKey.value = null
        return
      }
      load(currentFirewallId.value, currentVersionId.value)
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
