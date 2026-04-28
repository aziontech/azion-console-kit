<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'
  import Skeleton from 'primevue/skeleton'
  import BaseDeployCard from '@/templates/deploy-template/BaseDeployCard.vue'
  import { useVcsOAuth } from '@/composables/useVcsOAuth'
  import { solutionService } from '@/services/v2/marketplace/solution-service'
  import { useAccountStore } from '@/stores/account'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'
  import { useToast } from 'primevue/usetoast'

  const toast = useToast()
  const router = useRouter()

  // VCS OAuth composable
  const {
    isLoading: isVcsLoading,
    isRepositoriesLoading,
    repositories,
    connectedProviders,
    integrationsByProvider,
    selectedIntegration,
    connect: connectProvider,
    listIntegrations,
    listPlatforms,
    selectIntegration,
    setupPostMessageListener
  } = useVcsOAuth()

  // Cleanup function for postMessage listener
  let cleanupPostMessage = null

  // Selected provider tab
  const selectedProviderTab = ref(null)

  // Search query
  const searchQuery = ref('')

  // Git providers configuration
  const gitProviders = [
    {
      name: 'Github',
      key: 'github',
      bgColor: 'bg-[#24292f]',
      hoverBgColor: 'hover:bg-[#1c2024]',
      show: true
    },
    {
      name: 'Gitlab',
      key: 'gitlab',
      bgColor: 'bg-violet-800',
      hoverBgColor: 'hover:bg-violet-700',
      show: false
    },
    {
      name: 'Azure',
      key: 'azure',
      bgColor: 'bg-sky-600',
      hoverBgColor: 'hover:bg-sky-500',
      show: false
    },
    {
      name: 'Bitbucket',
      key: 'bitbucket',
      bgColor: 'bg-blue-800',
      hoverBgColor: 'hover:bg-blue-700',
      show: false
    }
  ]

  // Filter only visible providers
  const visibleGitProviders = computed(() => {
    return gitProviders.filter((provider) => provider.show)
  })

  // Filtered repositories based on search
  const filteredRepositories = computed(() => {
    if (!searchQuery.value) {
      return repositories.value.slice(0, 9)
    }
    const query = searchQuery.value.toLowerCase()
    return repositories.value.filter((repo) => repo.name?.toLowerCase().includes(query)).slice(0, 9)
  })

  // Get integrations for selected provider tab
  const integrationsForSelectedTab = computed(() => {
    if (!selectedProviderTab.value) return []
    return integrationsByProvider.value[selectedProviderTab.value] || []
  })

  // Check if any provider is connected
  const hasConnectedProviders = computed(() => connectedProviders.value.length > 0)

  /**
   * Handles provider connection via OAuth
   * @param {Object} provider - The provider object { name, key, bgColor, hoverBgColor }
   */
  const handleProviderConnect = async (provider) => {
    try {
      await connectProvider(provider.key)
      toast.add({
        severity: 'info',
        summary: `${provider.name} connection initiated`,
        detail: 'Complete the authorization in the popup window.',
        life: 3000
      })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: `Failed to connect ${provider.name}`,
        detail: error.message || 'An unexpected error occurred.',
        life: 5000
      })
    }
  }

  /**
   * Handles provider tab selection
   * @param {string} providerKey - The provider key
   */
  const handleProviderTabSelect = async (providerKey) => {
    selectedProviderTab.value = providerKey
    const providerIntegrations = integrationsByProvider.value[providerKey] || []
    if (providerIntegrations.length > 0) {
      // Auto-select first integration
      await selectIntegration(providerIntegrations[0])
    }
  }

  /**
   * Handles integration (account) selection
   * @param {Object} event - The PrimeVue Dropdown change event
   */
  const handleIntegrationSelect = async (event) => {
    await selectIntegration(event.value)
  }

  /**
   * Handles repository import - navigates to ImportGithubView with repository data
   * @param {Object} repository - The repository to import (contains name, url, etc.)
   */
  const handleRepositoryImport = (repository) => {
    router.push({
      name: 'github-repository-import',
      params: {
        vendor: 'azion',
        solution: 'import-from-github'
      },
      query: {
        gitScope: selectedIntegration.value?.value,
        repository: repository.url,
        repositoryName: repository.name,
        repositoryOwner: selectedIntegration.value?.label,
        provider: selectedProviderTab.value
      }
    })
  }

  /**
   * Callback when VCS integration is successful
   */
  const onVcsIntegrationSuccess = async () => {
    toast.add({
      severity: 'success',
      summary: 'Provider connected successfully',
      life: 3000
    })
    // Refresh integrations
    await listIntegrations()
  }

  // Watch for integrations changes to auto-select first provider
  watch(connectedProviders, (providers) => {
    if (providers.length > 0 && !selectedProviderTab.value) {
      handleProviderTabSelect(providers[0])
    }
  })

  // Initialize VCS OAuth on mount
  onMounted(async () => {
    cleanupPostMessage = setupPostMessageListener(onVcsIntegrationSuccess)
    await Promise.all([listPlatforms(), listIntegrations()])
  })

  // Cleanup on unmount
  onBeforeUnmount(() => {
    cleanupPostMessage?.()
  })

  const handleManageProviders = () => {
    // Navigate to provider management
  }

  // Get recommended solutions dynamically
  const accountStore = useAccountStore()
  const isFlagBlockApiV4 = hasFlagBlockApiV4()

  // Get jobRole from account store (available after login via prefetchList)
  const jobRole = accountStore.account?.jobRole

  // Build query params for recommended solutions
  // If no jobRole, fall back to 'templates' group which is always prefetched
  const queryParams = jobRole
    ? {
        group: 'recommended',
        type: isFlagBlockApiV4 ? jobRole : `${jobRole}-v4`
      }
    : {
        group: 'templates',
        type: isFlagBlockApiV4 ? 'onboarding' : 'onboarding-v4'
      }

  // Fetch solutions using the service (uses cached data from prefetchList)
  const { data: templates, isLoading } = solutionService.useListSolutions(queryParams)

  // Limit templates to 6 items for display
  const limitedTemplates = computed(() => {
    return templates.value?.slice(0, 6) || []
  })

  const handleTemplateSelect = (template) => {
    router.push({
      name: 'create-something-new',
      params: {
        vendor: template.vendor?.slug,
        solution: template.slug
      }
    })
  }

  const handleViewAllTemplates = () => {
    router.push({ name: 'create-start-from-template' })
  }
</script>

<template>
  <div class="flex-1 flex flex-col xl:flex-row gap-5 min-w-0">
    <!-- Connect Repository Card -->
    <div
      class="w-full xl:w-[578px] bg-[var(--surface-50)] rounded-md border surface-border flex flex-col"
    >
      <!-- Connected Providers View -->
      <div
        v-if="hasConnectedProviders"
        class="flex-1 p-3 sm:p-4 flex flex-col gap-3 sm:gap-4"
      >
        <!-- Account Dropdown and Search -->
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Account/Organization Dropdown -->
          <Dropdown
            :model-value="selectedIntegration"
            :options="integrationsForSelectedTab"
            option-label="label"
            placeholder="Select account"
            class="w-full sm:w-48"
            @change="handleIntegrationSelect"
            :pt="{
              root: { class: 'h-8 text-xs' },
              input: { class: 'text-xs' },
              item: { class: 'text-xs' }
            }"
          >
            <template #value="slotProps">
              <div class="flex items-center gap-2">
                <i
                  :class="[
                    'pi',
                    selectedProviderTab === 'github'
                      ? 'pi-github'
                      : selectedProviderTab === 'gitlab'
                        ? 'pi-gitlab'
                        : selectedProviderTab === 'azure'
                          ? 'pi-microsoft'
                          : 'pi-bitbucket'
                  ]"
                  class="text-xs"
                ></i>
                <span class="truncate">{{ slotProps.value?.label || 'Select account' }}</span>
              </div>
            </template>
            <template #option="slotProps">
              <div class="flex items-center gap-2 text-xs">
                <i
                  :class="[
                    'pi',
                    selectedProviderTab === 'github'
                      ? 'pi-github'
                      : selectedProviderTab === 'gitlab'
                        ? 'pi-gitlab'
                        : selectedProviderTab === 'azure'
                          ? 'pi-microsoft'
                          : 'pi-bitbucket'
                  ]"
                ></i>
                <span>{{ slotProps.option.label }}</span>
              </div>
            </template>
            <template #footer>
              <div class="p-dropdown-items-wrapper">
                <ul class="p-dropdown-items">
                  <li
                    class="p-dropdown-item flex items-center text-xs"
                    @click="
                      handleProviderConnect({
                        key: selectedProviderTab,
                        name:
                          selectedProviderTab.charAt(0).toUpperCase() + selectedProviderTab.slice(1)
                      })
                    "
                  >
                    <i class="pi pi-plus-circle mr-2"></i>
                    <div>
                      Add
                      {{
                        selectedProviderTab?.charAt(0).toUpperCase() + selectedProviderTab?.slice(1)
                      }}
                      Account
                    </div>
                  </li>
                </ul>
              </div>
            </template>
          </Dropdown>

          <!-- Search Input -->
          <div class="flex-1 relative">
            <InputText
              v-model="searchQuery"
              placeholder="Search project or enter a Git URL"
              class="w-full h-8 text-xs"
              :pt="{
                root: { class: 'pl-4 pr-4' }
              }"
            />
          </div>
        </div>

        <!-- Repository List -->
        <div class="surface-50 rounded-md border surface-border overflow-hidden">
          <!-- Loading State -->
          <div
            v-if="isRepositoriesLoading"
            class="p-8 text-center"
          >
            <i class="pi pi-spinner pi-spin text-2xl text-color-secondary"></i>
            <p class="mt-2 text-xs text-color-secondary">Loading repositories...</p>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="!filteredRepositories.length"
            class="p-8 text-center"
          >
            <i class="pi pi-folder text-2xl text-color-secondary"></i>
            <p class="mt-2 text-xs text-color-secondary">
              {{
                searchQuery
                  ? 'No repositories found matching your search'
                  : 'No repositories found for this account'
              }}
            </p>
          </div>

          <!-- Repository List -->
          <div
            v-else
            class="max-h-[400px] sm:max-h-[600px] overflow-y-auto"
          >
            <div
              v-for="repo in filteredRepositories"
              :key="repo.id || repo.name"
              class="px-3 sm:px-5 py-2.5 sm:py-3 border-b surface-border flex items-center justify-between gap-2 sm:gap-2.5 hover:surface-100 transition-colors"
            >
              <div class="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                <!-- Provider Icon -->
                <i
                  :class="[
                    'pi',
                    selectedProviderTab === 'github'
                      ? 'pi-github'
                      : selectedProviderTab === 'gitlab'
                        ? 'pi-gitlab'
                        : selectedProviderTab === 'azure'
                          ? 'pi-microsoft'
                          : 'pi-bitbucket'
                  ]"
                  class="text-sm flex-shrink-0"
                ></i>
                <!-- Repository Name -->
                <span class="text-xs text-color truncate">{{ repo.name }}</span>
                <!-- Last Updated - hidden on very small screens -->
                <span
                  v-if="repo.updated_at"
                  class="text-[10px] text-color-secondary hidden sm:inline"
                >
                  {{ repo.updated_at }}
                </span>
              </div>
              <!-- Import Button -->
              <PrimeButton
                label="IMPORT"
                size="small"
                severity="secondary"
                class="text-xs flex-shrink-0"
                :pt="{
                  root: { class: 'px-2 sm:px-2.5 py-1.5' }
                }"
                @click="handleRepositoryImport(repo)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div
        v-else-if="isVcsLoading"
        class="flex-1 px-3 sm:px-4 pt-3 pb-4 flex flex-col items-center justify-center gap-4 sm:gap-6"
      >
        <div class="w-full max-w-80 flex flex-col items-center gap-4 sm:gap-6">
          <!-- Header Skeleton -->
          <div class="text-center px-2 w-full">
            <Skeleton
              height="16px"
              width="180px"
              class="mx-auto mb-2"
            />
            <Skeleton
              height="12px"
              width="100%"
              class="mb-1"
            />
            <Skeleton
              height="12px"
              width="80%"
              class="mx-auto"
            />
          </div>

          <!-- Git Provider Buttons Skeleton -->
          <div class="w-full grid grid-cols-2 sm:flex sm:flex-col gap-2 sm:gap-2.5">
            <div
              v-for="i in 4"
              :key="i"
              class="w-full h-10 sm:h-11 rounded-md"
            >
              <Skeleton
                height="100%"
                width="100%"
                class="rounded-md"
              />
            </div>
          </div>

          <!-- Manage Providers Link Skeleton -->
          <Skeleton
            height="20px"
            width="180px"
            class="mx-auto"
          />
        </div>
      </div>

      <!-- No Connected Providers - Initial View -->
      <div
        v-else
        class="flex-1 px-3 sm:px-4 pt-3 pb-4 flex flex-col items-center justify-center gap-4 sm:gap-6"
      >
        <div class="w-full max-w-80 flex flex-col items-center gap-4 sm:gap-6">
          <!-- Header -->
          <div class="text-center px-2">
            <h2 class="text-sm font-semibold text-color leading-4">Connect your Repository</h2>
            <p class="mt-2 text-xs text-color-secondary leading-4">
              Choose a Git provider to connect your repository<br class="hidden sm:inline" />
              <span class="sm:hidden"> </span>and start the deployment process.
            </p>
          </div>

          <!-- Git Provider Buttons -->
          <div class="w-full grid grid-cols-2 sm:flex sm:flex-col gap-2 sm:gap-2.5">
            <div
              v-for="provider in visibleGitProviders"
              :key="provider.key"
              class="w-full h-10 sm:h-11 px-3 sm:px-4 rounded-md border surface-border flex items-center justify-center gap-2 transition-colors cursor-pointer"
              :class="[
                provider.bgColor,
                provider.hoverBgColor,
                { 'opacity-50 pointer-events-none': isVcsLoading }
              ]"
              @click="handleProviderConnect(provider)"
            >
              <!-- Provider Icon -->
              <span class="w-3.5 h-3.5 flex items-center justify-center">
                <i
                  :class="[
                    'pi',
                    provider.key === 'github'
                      ? 'pi-github'
                      : provider.key === 'gitlab'
                        ? 'pi-gitlab'
                        : provider.key === 'azure'
                          ? 'pi-microsoft'
                          : 'pi-bitbucket'
                  ]"
                  class="text-white text-sm"
                ></i>
              </span>
              <span class="text-xs font-mono font-semibold text-white leading-3">
                <span class="hidden sm:inline">Continue with </span>{{ provider.name }}
              </span>
            </div>
          </div>

          <!-- Manage Providers Link -->
          <PrimeButton
            type="button"
            label="Manage connected providers"
            link
            class="w-full sm:w-auto"
            icon="pi pi-external-link"
            iconPos="right"
            size="small"
            @click="handleManageProviders"
            :pt="{
              root: { class: 'justify-center' },
              label: { class: 'grow-0' }
            }"
          />
        </div>
      </div>
    </div>

    <!-- Recommended Templates Card -->
    <BaseDeployCard
      title="Recomended Templates"
      title-size="text-sm"
      class="flex-1 min-w-0"
      :loading="isLoading"
      backgroudcontent="bg-[var(--surface-100)]"
    >
      <template #content>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-3 gap-2.5"
        >
          <article
            v-for="template in limitedTemplates"
            :key="template.id"
            class="p-3 sm:p-4 bg-[var(--surface-50)] rounded border surface-border cursor-pointer transition-all duration-200 hover:border-link hover:surface-100 hover:shadow-md"
            @click="handleTemplateSelect(template)"
          >
            <div class="flex flex-col gap-3 sm:gap-4">
              <img
                v-if="template.vendor.icon"
                :src="template.vendor.icon"
                :alt="template.vendor.name"
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-sm object-cover"
              />
              <div
                v-else
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-sm surface-200 flex items-center justify-center text-xs font-semibold text-color-secondary"
              >
                {{ template.name?.charAt(0)?.toUpperCase() || 'T' }}
              </div>
              <div class="flex flex-col gap-1.5 sm:gap-2">
                <h4 class="text-xs font-semibold text-color leading-3">
                  {{ template.name }}
                </h4>
                <p class="text-xs text-color-secondary leading-4 line-clamp-2">
                  {{ template.headline }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </template>
      <template #footer>
        <PrimeButton
          type="button"
          label="View all Templates..."
          link
          iconPos="right"
          size="small"
          @click="handleViewAllTemplates"
        />
      </template>
    </BaseDeployCard>
  </div>
</template>

<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
