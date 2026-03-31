import { ref, computed } from 'vue'
import { vcsService } from '@/services/v2/vcs/vcs-service'
import { useToast } from 'primevue/usetoast'

/**
 * Composable for handling VCS OAuth connections (GitHub, GitLab, Azure, Bitbucket)
 * Provides a reusable interface for connecting to version control providers
 *
 * @returns {Object} VCS OAuth utilities and state
 */
export function useVcsOAuth() {
  const toast = useToast()

  // State
  const isLoading = ref(false)
  const isRepositoriesLoading = ref(false)
  const platforms = ref([])
  const integrations = ref([])
  const repositories = ref([])
  const callbackUrl = ref('')
  const selectedIntegration = ref(null)

  // Computed
  const hasIntegrations = computed(() => integrations.value?.length > 0)

  /**
   * Returns the list of connected provider IDs
   * @returns {Array<string>} List of connected provider IDs (e.g., ['github', 'gitlab'])
   */
  const connectedProviders = computed(() => {
    const providers = integrations.value.map((integration) => integration.provider)
    return [...new Set(providers.filter(Boolean))]
  })

  /**
   * Groups integrations by provider
   * @returns {Object} Integrations grouped by provider ID
   */
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

  /**
   * Loads available VCS platforms (github, gitlab, azure, bitbucket)
   * @returns {Promise<Array>} List of platforms
   */
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

  /**
   * Loads user's existing VCS integrations
   * @returns {Promise<Array>} List of integrations
   */
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

  /**
   * Opens the OAuth popup for the specified provider
   * @param {string} providerKey - The provider key (github, gitlab, azure, bitbucket)
   * @returns {Promise<void>}
   */
  const connect = async (providerKey) => {
    try {
      isLoading.value = true

      // Load platforms if not already loaded
      if (!platforms.value.length) {
        await listPlatforms()
      }

      // Find the provider
      const provider = platforms.value.find((platform) => platform.id === providerKey)
      if (!provider) {
        throw new Error(`Provider "${providerKey}" not found`)
      }

      // Store callback URL for later use
      callbackUrl.value = provider.callbackUrl

      // Open popup
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

  /**
   * Handles postMessage events from OAuth popup
   * @param {MessageEvent} event - The message event
   * @param {Function} onSuccess - Optional callback on successful integration
   */
  const handlePostMessage = async (event, onSuccess) => {
    if (event.data.event === 'integration-data') {
      await saveIntegration(event.data)
      onSuccess?.()
    }
  }

  /**
   * Saves the integration after OAuth callback
   * @param {Object} integration - The integration data from OAuth
   * @returns {Promise<void>}
   */
  const saveIntegration = async (integration) => {
    try {
      isLoading.value = true
      await vcsService.postCallbackUrl(callbackUrl.value, integration.data)
      // Refresh integrations list
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

  /**
   * Sets up postMessage listener for OAuth callback
   * @param {Function} onSuccess - Optional callback on successful integration
   * @returns {Function} Cleanup function to remove listener
   */
  const setupPostMessageListener = (onSuccess) => {
    const handler = (event) => handlePostMessage(event, onSuccess)
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }

  /**
   * Lists repositories for a specific integration
   * @param {string} integrationId - The integration ID to list repositories for
   * @param {Object} params - Query parameters (pageSize, ordering, etc.)
   * @returns {Promise<Array>} List of repositories
   */
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

  /**
   * Selects an integration and loads its repositories
   * @param {Object} integration - The integration to select
   * @returns {Promise<Array>} List of repositories
   */
  const selectIntegration = async (integration) => {
    selectedIntegration.value = integration
    if (integration?.value) {
      return await listRepositories(integration.value)
    }
    repositories.value = []
    return []
  }

  /**
   * Initializes the composable with platforms and integrations
   * Sets up postMessage listener automatically
   * @param {Function} onSuccess - Optional callback on successful integration
   * @returns {Promise<void>}
   */
  const initialize = async (onSuccess) => {
    await Promise.all([listPlatforms(), listIntegrations()])
    setupPostMessageListener(onSuccess)
  }

  return {
    // State
    isLoading,
    isRepositoriesLoading,
    platforms,
    integrations,
    repositories,
    callbackUrl,
    selectedIntegration,

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
