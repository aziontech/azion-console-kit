import { computed, ref } from 'vue'
import { vcsService } from '@/services/v2/vcs/vcs-service'
import { useToast } from '@aziontech/webkit/use-toast'

/**
 * Composable for handling VCS OAuth connections (GitHub, GitLab, Azure, Bitbucket)
 * Provides a reusable interface for connecting to version control providers
 *
 * @returns {Object} VCS OAuth utilities and state
 */
export function useVcsOAuth() {
  const toast = useToast()

  const isLoading = ref(false)
  const isRepositoriesLoading = ref(false)
  const platforms = ref([])
  const integrations = ref([])
  const repositories = ref([])
  const callbackUrl = ref('')

  const hasIntegrations = computed(() => integrations.value?.length > 0)

  const connectedProviders = computed(() => {
    const providers = integrations.value.map((integration) => integration.provider)
    return [...new Set(providers.filter(Boolean))]
  })

  const integrationsByProvider = computed(() => {
    const grouped = {}
    integrations.value.forEach((integration) => {
      const providerId = integration.provider
      if (!grouped[providerId]) {
        grouped[providerId] = []
      }
      grouped[providerId].push(integration)
    })
    return grouped
  })

  const listPlatforms = async () => {
    try {
      const data = await vcsService.listPlatforms()
      platforms.value = data
      return data
    } catch (error) {
      error.showErrors?.(toast)
      return []
    }
  }

  const listIntegrations = async () => {
    try {
      isLoading.value = true
      const data = await vcsService.listIntegrations()
      integrations.value = data
      return data
    } catch (error) {
      error.showErrors?.(toast)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const connect = async (providerKey) => {
    try {
      isLoading.value = true

      if (!platforms.value.length) {
        await listPlatforms()
      }

      const provider = platforms.value.find((platform) => platform.id === providerKey)
      if (!provider) {
        throw new Error(`Provider "${providerKey}" not found`)
      }

      callbackUrl.value = provider.callbackUrl

      window.open(
        provider.installationUrl,
        'vcs-oauth',
        'popup=yes,scrollbars=no,width=600,height=700'
      )
    } catch (error) {
      error.showErrors?.(toast)
    } finally {
      isLoading.value = false
    }
  }

  const handlePostMessage = async (event, onSuccess) => {
    if (event.data.event === 'integration-data') {
      await saveIntegration(event.data)
      onSuccess?.()
    }
  }

  const saveIntegration = async (integration) => {
    try {
      isLoading.value = true
      await vcsService.postCallbackUrl(callbackUrl.value, integration.data)
      await listIntegrations()
    } catch (error) {
      error.showWithOptions?.(toast, (err) => ({
        summary: `VCS integration failed: ${err.detail}`,
        severity: 'error'
      }))
    } finally {
      isLoading.value = false
    }
  }

  const setupPostMessageListener = (onSuccess) => {
    const handler = (event) => handlePostMessage(event, onSuccess)
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }

  const listRepositories = async (integrationId, params = { pageSize: 100, ordering: 'name' }) => {
    try {
      isRepositoriesLoading.value = true
      const data = await vcsService.listRepositories(integrationId, params)
      repositories.value = data
      return data
    } catch (error) {
      error.showErrors?.(toast)
      return []
    } finally {
      isRepositoriesLoading.value = false
    }
  }

  const selectIntegration = async (integration) => {
    if (integration?.value) {
      return await listRepositories(integration.value)
    }
    repositories.value = []
    return []
  }

  const initialize = async (onSuccess) => {
    await Promise.all([listPlatforms(), listIntegrations()])
    setupPostMessageListener(onSuccess)
  }

  return {
    // State refs
    isLoading,
    isRepositoriesLoading,
    platforms,
    integrations,
    repositories,
    callbackUrl,

    // Computed
    hasIntegrations,
    connectedProviders,
    integrationsByProvider,

    // Methods
    listPlatforms,
    listIntegrations,
    listRepositories,
    connect,
    saveIntegration,
    handlePostMessage,
    setupPostMessageListener,
    initialize,
    selectIntegration
  }
}
