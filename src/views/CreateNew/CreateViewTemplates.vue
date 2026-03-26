<script setup>
  import { ref, computed } from 'vue'
  import Menu from 'primevue/menu'
  import ContentBlock from '@/templates/content-block'
  import PrimeButton from 'primevue/button'
  import BaseDeployCard from '@/templates/deploy-template/BaseDeployCard.vue'
  import { solutionService } from '@/services/v2/marketplace/solution-service'
  import { useAccountStore } from '@/stores/account'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'

  // Navigation state
  const activeNav = ref('import')

  const navItems = computed(() => [
    {
      label: 'Import from Git',
      key: 'import',
      command: () => setNavActive('import')
    },
    {
      label: 'Start from Templates',
      key: 'templates',
      icon: 'pi pi-chevron-right',
      command: () => setNavActive('templates')
    },
    {
      label: 'Create Resources',
      key: 'resources',
      icon: 'pi pi-chevron-right',
      command: () => setNavActive('resources')
    }
  ])

  // Git providers configuration
  const gitProviders = [
    {
      name: 'Github',
      key: 'github',
      bgColor: 'bg-[#24292f]',
      hoverBgColor: 'hover:bg-[#1c2024]'
    },
    {
      name: 'Gitlab',
      key: 'gitlab',
      bgColor: 'bg-violet-800',
      hoverBgColor: 'hover:bg-violet-700'
    },
    {
      name: 'Azure',
      key: 'azure',
      bgColor: 'bg-sky-600',
      hoverBgColor: 'hover:bg-sky-500'
    },
    {
      name: 'Bitbucket',
      key: 'bitbucket',
      bgColor: 'bg-blue-800',
      hoverBgColor: 'hover:bg-blue-700'
    }
  ]

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

  // eslint-disable-next-line no-unused-vars
  const handleProviderConnect = (provider) => {
    // Integration logic for OAuth flow will be added here
    // provider param contains: { name, key, bgColor, hoverBgColor }
  }

  // eslint-disable-next-line no-unused-vars
  const handleTemplateSelect = (template) => {
    // Template selection logic for navigation
    // template param contains: { id, name, headline, vendor, slug, ... }
  }

  const handleViewAllTemplates = () => {
    // Navigate to full templates list
  }

  const handleManageProviders = () => {
    // Navigate to provider management
  }

  const setNavActive = (key) => {
    activeNav.value = key
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <div>
        <div
          data-level="Three"
          class="inline-flex justify-start items-center gap-2"
        >
          <div
            data-lastitem="True"
            data-state="Idle"
            class="p-1 rounded-md flex justify-center items-center"
          >
            <div
              class="justify-start text-Menu-breadcrumbLastItemTextColor text-base font-semibold font-['Sora'] leading-4"
            >
              Creation Center
            </div>
          </div>
        </div>
        <div class="self-stretch flex flex-col justify-center items-start gap-3">
          <div
            class="self-stretch px-1 inline-flex justify-between items-end flex-wrap content-end"
          >
            <div class="inline-flex flex-col justify-center items-start gap-3">
              <div
                class="justify-start text-Global-textSecondaryColor text-xs font-normal font-['Sora'] leading-7"
              >
                Start from a repository, use a template, or create resources from scratch.
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #content>
      <div class="w-full min-h-full flex flex-col lg:flex-row px-1 gap-4 lg:gap-8 mt-4 md:mt-8">
        <!-- Sidebar Navigation -->
        <nav class="w-full lg:w-64 flex-shrink-0">
          <div class="flex flex-col gap-3 lg:gap-5">
            <div class="text-xs font-mono text-color-secondary">How to start</div>
            <Menu
              :model="navItems"
              class="w-full border-none bg-transparent p-0"
              :pt="{
                menuitem: ({ context }) => ({
                  class: [
                    'h-8 rounded cursor-pointer transition-colors mb-2',
                    activeNav === context.item?.key
                      ? 'bg-listbox-option-focus-background text-listbox-option-focus-color'
                      : 'text-color-secondary hover:bg-surface-100'
                  ]
                }),
                content: { class: 'w-full' },
                action: { class: 'w-full flex items-center justify-between px-2' },
                label: { class: 'text-xs font-sora order-1' },
                icon: { class: 'text-xs order-2' }
              }"
            />
          </div>
        </nav>

        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col lg:flex-row gap-5 min-w-0">
          <!-- Connect Repository Card -->
          <div
            class="w-full lg:w-[578px] bg-surface-section rounded-md border surface-border flex flex-col"
          >
            <div class="flex-1 px-4 pt-3 pb-4 flex flex-col items-center justify-center gap-6">
              <div class="w-full max-w-80 flex flex-col items-center gap-6">
                <!-- Header -->
                <div class="text-center">
                  <h2 class="text-sm font-semibold text-color leading-4">
                    Connect your Repository
                  </h2>
                  <p class="mt-2 text-xs text-color-secondary leading-4">
                    Choose a Git provider to connect your repository<br />
                    and start the deployment process.
                  </p>
                </div>

                <!-- Git Provider Buttons -->
                <div class="w-full flex flex-col gap-2.5">
                  <button
                    v-for="provider in gitProviders"
                    :key="provider.key"
                    class="w-full h-11 px-4 rounded-md border surface-border flex items-center justify-center gap-2 transition-colors"
                    :class="[provider.bgColor, provider.hoverBgColor]"
                    @click="handleProviderConnect(provider)"
                  >
                    <!-- Provider Icon -->
                    <span class="w-3.5 h-3.5 flex items-center justify-center">
                      <svg
                        v-if="provider.key === 'github'"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="text-white"
                      >
                        <path
                          d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                        />
                      </svg>
                      <svg
                        v-else-if="provider.key === 'gitlab'"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="text-white"
                      >
                        <path
                          d="M22.65 14.75L20.7 8.45a.57.57 0 00-.03-.11l-2.1-6.45a.85.85 0 00-.8-.58.87.87 0 00-.79.58l-2 6.14H9l-2-6.14a.87.87 0 00-.79-.58.85.85 0 00-.8.58l-2.09 6.45a.57.57 0 00-.03.11l-1.94 6.3a1.26 1.26 0 00.46 1.4l10.3 7.49a.52.52 0 00.61 0l10.3-7.49a1.26 1.26 0 00.46-1.4z"
                        />
                      </svg>
                      <svg
                        v-else-if="provider.key === 'azure'"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="text-white"
                      >
                        <path
                          d="M5.48 10.11L12 3.59l6.52 6.52H5.48zM3.59 12L12 3.59 3.59 12zm8.41 8.41L3.59 12h8.41v8.41zm1.18-8.41h8.41l-8.41 8.41V12zm8.41 0L12 3.59 20.41 12H12z"
                        />
                      </svg>
                      <svg
                        v-else-if="provider.key === 'bitbucket'"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="text-white"
                      >
                        <path
                          d="M.778 1.211c-.43 0-.773.35-.778.78 0 .065 0 .131.016.195l2.896 17.924c.08.49.51.855 1.01.865h14.228c.43 0 .786-.33.86-.75l2.88-17.97a.778.778 0 00-.654-.89.778.778 0 00-.195-.015L.778 1.211zm13.578 12.298H9.744l-1.544-7.467h6.544l-1.388 7.467z"
                        />
                      </svg>
                    </span>
                    <span class="text-xs font-mono font-semibold text-white leading-3">
                      Continue with {{ provider.name }}
                    </span>
                  </button>
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
            title="Recommended Templates"
            class="flex-1 min-w-0"
            :loading="isLoading"
          >
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2.5">
                <article
                  v-for="template in templates"
                  :key="template.id"
                  class="p-4 bg-surface-50 rounded border surface-border cursor-pointer transition-all duration-200 hover:border-link hover:bg-surface-100 hover:shadow-md"
                  @click="handleTemplateSelect(template)"
                >
                  <div class="flex flex-col gap-4">
                    <img
                      v-if="template.icon"
                      :src="template.icon"
                      :alt="template.name"
                      class="w-9 h-9 rounded-sm object-cover"
                    />
                    <div
                      v-else
                      class="w-9 h-9 rounded-sm bg-surface-200 flex items-center justify-center text-xs font-semibold text-color-secondary"
                    >
                      {{ template.name?.charAt(0)?.toUpperCase() || 'T' }}
                    </div>
                    <div class="flex flex-col gap-2">
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
      </div>
    </template>
  </ContentBlock>
</template>

<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
