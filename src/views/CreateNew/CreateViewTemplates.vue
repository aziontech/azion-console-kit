<script setup>
  import { computed, onMounted, onBeforeUnmount } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import Menu from 'primevue/menu'
  import ContentBlock from '@/templates/content-block'
  import { useVcsOAuth } from '@/composables/useVcsOAuth'
  import { useToast } from 'primevue/usetoast'

  const toast = useToast()
  const route = useRoute()
  const router = useRouter()

  // VCS OAuth composable - needed for postMessage handling
  const { listIntegrations, listPlatforms, setupPostMessageListener } = useVcsOAuth()

  // Cleanup function for postMessage listener
  let cleanupPostMessage = null

  // Get the current active navigation from route
  const activeNav = computed(() => {
    const path = route.path
    if (path.includes('import-from-git')) return 'import'
    if (path.includes('start-from-template')) return 'templates'
    if (path.includes('create-resource')) return 'resources'
    return 'import' // default
  })

  const navItems = computed(() => [
    {
      label: 'Import from Git',
      key: 'import',
      command: () => navigateTo('create-import-from-git')
    },
    {
      label: 'Start from Templates',
      key: 'templates',
      icon: 'pi pi-chevron-right',
      command: () => navigateTo('create-start-from-template')
    },
    {
      label: 'Create Resources',
      key: 'resources',
      icon: 'pi pi-chevron-right',
      command: () => navigateTo('create-create-resource')
    }
  ])

  // Navigation helper
  const navigateTo = (routeName) => {
    router.push({ name: routeName })
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

  // Initialize VCS OAuth on mount
  onMounted(async () => {
    cleanupPostMessage = setupPostMessageListener(onVcsIntegrationSuccess)
    await Promise.all([listPlatforms(), listIntegrations()])
  })

  // Cleanup on unmount
  onBeforeUnmount(() => {
    cleanupPostMessage?.()
  })
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
      <div class="w-full min-h-full flex flex-col xl:flex-row px-1 gap-4 xl:gap-8 mt-4 md:mt-8">
        <!-- Sidebar Navigation -->
        <nav class="w-full xl:w-64 flex-shrink-0">
          <div class="flex flex-col gap-3 xl:gap-5">
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

        <!-- Main Content Area - Router View for child routes -->
        <div class="flex-1 min-w-0">
          <router-view v-slot="{ Component }">
            <transition
              name="fade"
              mode="out-in"
            >
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.15s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
