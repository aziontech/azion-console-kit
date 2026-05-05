import { reactive, computed } from 'vue'
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

  const state = reactive({
    loading: {
      main: false,
      repositories: false
    },
    platforms: [],
    integrations: [],
    repositories: [],
    callbackUrl: '',
    selectedIntegration: null
  })

  const hasIntegrations = computed(() => state.integrations?.length > 0)

  const connectedProviders = computed(() => {
    const providers = state.integrations.map((integration) => integration.provider)
    return [...new Set(providers.filter(Boolean))]
  })

  const integrationsByProvider = computed(() => {
    const grouped = {}
    state.integrations.forEach((integration) => {
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
      state.platforms = data
      return data
    } catch (error) {
      error.showErrors?.(toast)
      return []
    }
  }

  const listIntegrations = async () => {
    try {
      state.loading.main = true
      const data = await vcsService.listIntegrations()
      state.integrations = data
      return data
    } catch (error) {
      error.showErrors?.(toast)
      return []
    } finally {
      state.loading.main = false
    }
  }

  const connect = async (providerKey) => {
    try {
      state.loading.main = true

      if (!state.platforms.length) {
        await listPlatforms()
      }

      const provider = state.platforms.find((platform) => platform.id === providerKey)
      if (!provider) {
        throw new Error(`Provider "${providerKey}" not found`)
      }

      state.callbackUrl = provider.callbackUrl

      window.open(
        provider.installationUrl,
        'vcs-oauth',
        'popup=yes,scrollbars=no,width=600,height=700'
      )
    } catch (error) {
      error.showErrors?.(toast)
    } finally {
      state.loading.main = false
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
      state.loading.main = true
      await vcsService.postCallbackUrl(state.callbackUrl, integration.data)
      await listIntegrations()
    } catch (error) {
      error.showWithOptions?.(toast, (err) => ({
        summary: `VCS integration failed: ${err.detail}`,
        severity: 'error'
      }))
    } finally {
      state.loading.main = false
    }
  }

  const setupPostMessageListener = (onSuccess) => {
    const handler = (event) => handlePostMessage(event, onSuccess)
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }

  const listRepositories = async (integrationId, params = { pageSize: 100, ordering: 'name' }) => {
    try {
      state.loading.repositories = true
      const data = await vcsService.listRepositories(integrationId, params)
      state.repositories = data
      return data
    } catch (error) {
      error.showErrors?.(toast)
      return []
    } finally {
      state.loading.repositories = false
    }
  }

  const selectIntegration = async (integration) => {
    state.selectedIntegration = integration
    if (integration?.value) {
      return await listRepositories(integration.value)
    }
    state.repositories = []
    return []
  }

  const initialize = async (onSuccess) => {
    await Promise.all([listPlatforms(), listIntegrations()])
    setupPostMessageListener(onSuccess)
  }

  return {
    state,

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
