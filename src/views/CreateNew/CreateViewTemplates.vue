<script setup>
  import { computed, onMounted, onBeforeUnmount, ref, reactive, provide, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import Menu from 'primevue/menu'
  import Checkbox from 'primevue/checkbox'
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

  // Track if we should show the main menu (overriding the sub-menu view)
  const showMainMenu = ref(true)

  // Category filters for Resources section
  const selectedCategories = ref([])
  provide('selectedCategories', selectedCategories)

  const categoryOptions = [
    { label: 'Build', value: 'build' },
    { label: 'Store', value: 'store' },
    { label: 'Secure', value: 'secure' },
    { label: 'Observe', value: 'observe' }
  ]

  // Template filters for Templates section - using reactive for proper provide/inject reactivity
  const selectedTemplateFilters = reactive({
    frameworks: [],
    useCases: [],
    databases: []
  })
  provide('selectedTemplateFilters', selectedTemplateFilters)

  // Track which filter groups are expanded
  const expandedFilterGroups = ref({
    useCases: false,
    databases: false,
    frameworks: true
  })

  // Template filter groups with their options
  const templateFilterGroups = [
    {
      key: 'useCases',
      label: 'Use Cases',
      options: [
        { label: 'AI', value: 'ai' },
        { label: 'Blog', value: 'blog' },
        { label: 'CDN', value: 'cdn' },
        { label: 'CMS', value: 'cms' },
        { label: 'Documentation', value: 'documentation' },
        { label: 'E-commerce', value: 'ecommerce' },
        { label: 'Marketing Website', value: 'marketing-website' },
        { label: 'Portfolio Website', value: 'portfolio-website' },
        { label: 'Security', value: 'security' },
        { label: 'Starter', value: 'starter' },
        { label: 'Static Site', value: 'static-site' },
        { label: 'Web Application', value: 'web-application' }
      ]
    },
    {
      key: 'databases',
      label: 'Databases',
      options: [
        { label: 'Azion KV Store', value: 'azion-kv' },
        { label: 'Azion SQL Database', value: 'azion-sql' },
        { label: 'MongoDB', value: 'mongodb' },
        { label: 'Neon', value: 'neon' },
        { label: 'TiDB', value: 'tidb' },
        { label: 'Turso', value: 'turso' },
        { label: 'Upstash Redis', value: 'upstash-redis' }
      ]
    },
    {
      key: 'frameworks',
      label: 'Frameworks',
      options: [
        { label: 'Angular', value: 'angular' },
        { label: 'Astro', value: 'astro' },
        { label: 'Docusaurus', value: 'docusaurus' },
        { label: 'Eleventy (11ty)', value: 'eleventy' },
        { label: 'Emscripten', value: 'emscripten' },
        { label: 'Gatsby', value: 'gatsby' },
        { label: 'Hexo', value: 'hexo' },
        { label: 'Hono', value: 'hono' },
        { label: 'Hugo', value: 'hugo' },
        { label: 'Jekyll', value: 'jekyll' },
        { label: 'Next.js', value: 'nextjs' },
        { label: 'Nuxt', value: 'nuxt' },
        { label: 'Preact', value: 'preact' },
        { label: 'Qwik', value: 'qwik' },
        { label: 'React', value: 'react' },
        { label: 'Rust WASM', value: 'rust-wasm' },
        { label: 'Stencil', value: 'stencil' },
        { label: 'SvelteKit', value: 'sveltekit' },
        { label: 'Vanilla JS', value: 'vanilla-js' },
        { label: 'Vitepress', value: 'vitepress' },
        { label: 'Vue', value: 'vue' },
        { label: 'Vuepress', value: 'vuepress' }
      ]
    }
  ]

  // Get the current active navigation from route name
  const activeNav = computed(() => {
    const routeName = route.name
    if (routeName === 'create-import-from-git') return 'import'
    if (routeName === 'create-start-from-template') return 'templates'
    if (routeName === 'create-create-resource') return 'resources'
    return 'import' // default
  })

  // Watch route changes - only set initial state, subsequent changes handled by navigation
  watch(
    () => route.name,
    (newRouteName) => {
      // Only auto-switch on initial load or when navigating to import
      if (newRouteName === 'create-import-from-git') {
        showMainMenu.value = true
      }
    },
    { immediate: true }
  )

  const navItems = computed(() => [
    {
      label: 'Import from Git',
      key: 'import',
      active: activeNav.value === 'import',
      command: () => {
        showMainMenu.value = true
        navigateTo('create-import-from-git')
      }
    },
    {
      label: 'Start from Templates',
      key: 'templates',
      icon: 'pi pi-chevron-right',
      active: activeNav.value === 'templates',
      command: () => {
        showMainMenu.value = false
        navigateTo('create-start-from-template')
      }
    },
    {
      label: 'Create Resources',
      key: 'resources',
      icon: 'pi pi-chevron-right',
      active: activeNav.value === 'resources',
      command: () => {
        showMainMenu.value = false
        navigateTo('create-create-resource')
      }
    }
  ])

  // Navigation helper
  const navigateTo = (routeName) => {
    router.push({ name: routeName })
  }

  // Go back to main menu from Resources or Templates (without changing route)
  const goBackToMenu = () => {
    showMainMenu.value = true
  }

  // Toggle category selection
  const toggleCategory = (categoryValue) => {
    const index = selectedCategories.value.indexOf(categoryValue)
    if (index === -1) {
      selectedCategories.value.push(categoryValue)
    } else {
      selectedCategories.value.splice(index, 1)
    }
  }

  // Toggle filter group expansion
  const toggleFilterGroup = (groupKey) => {
    expandedFilterGroups.value[groupKey] = !expandedFilterGroups.value[groupKey]
  }

  // Toggle template filter selection
  const toggleTemplateFilter = (groupKey, filterValue) => {
    if (!selectedTemplateFilters[groupKey]) {
      selectedTemplateFilters[groupKey] = []
    }
    const index = selectedTemplateFilters[groupKey].indexOf(filterValue)
    if (index === -1) {
      selectedTemplateFilters[groupKey].push(filterValue)
    } else {
      selectedTemplateFilters[groupKey].splice(index, 1)
    }
  }

  // Check if a filter is selected
  const isFilterSelected = (groupKey, filterValue) => {
    return selectedTemplateFilters[groupKey]?.includes(filterValue) || false
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
        <nav
          class="w-full xl:w-64 flex-shrink-0 sticky top-5 self-start max-h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          <!-- Default Menu for Import section (or when showMainMenu is true) -->
          <div
            v-if="showMainMenu || activeNav === 'import'"
            class="flex flex-col gap-3 xl:gap-5"
          >
            <div class="text-xs font-mono text-color-secondary">HOW TO START</div>
            <Menu
              :model="navItems"
              class="w-full border-none bg-transparent p-0 create-menu"
              :pt="{
                menuitem: ({ context }) => ({
                  class: [
                    'h-8 rounded cursor-pointer transition-colors mb-2',
                    context.item?.active
                      ? ' text-listbox-option-focus-color surface-300 h-full'
                      : 'text-color-secondary bg-surface-900 h-full'
                  ]
                }),

                content: { class: 'w-full' },
                action: { class: 'w-full flex items-center justify-between px-2' },
                label: { class: 'text-xs font-sora order-1' },
                icon: { class: 'text-xs order-2' }
              }"
            />
          </div>

          <!-- Templates Section Menu with Filters -->
          <div
            v-else-if="activeNav === 'templates'"
            class="flex flex-col gap-5"
          >
            <!-- Back to Templates Button -->
            <button
              class="w-64 h-8 px-2.5 py-1.5 rounded surface-border border inline-flex justify-start items-center gap-3 hover:bg-surface-900 transition-colors"
              @click="goBackToMenu"
            >
              <i class="pi pi-angle-left" />
              <span
                class="flex-1 text-left text-listbox-option-focus-color text-xs font-normal font-['Sora']"
                >Templates</span
              >
            </button>

            <!-- Filter Groups -->
            <div class="flex flex-col gap-5">
              <div
                v-for="group in templateFilterGroups"
                :key="group.key"
                class="flex flex-col gap-4"
              >
                <!-- Group Header (collapsible) -->
                <button
                  class="self-stretch h-5 inline-flex justify-between items-center cursor-pointer"
                  @click="toggleFilterGroup(group.key)"
                >
                  <span class="text-Text-text-color-muted text-xs font-normal font-['Proto_Mono']">
                    {{ group.label }}
                  </span>
                  <div
                    class="w-5 h-5 flex justify-center items-center gap-2.5 transition-transform"
                  >
                    <i
                      :class="[
                        'pi pi-chevron-right text-xs text-color-secondary transition-transform',
                        expandedFilterGroups[group.key] ? 'rotate-90' : ''
                      ]"
                    />
                  </div>
                </button>

                <!-- Group Options (shown when expanded) -->
                <div
                  v-if="expandedFilterGroups[group.key]"
                  class="flex flex-col gap-1"
                >
                  <div
                    v-for="option in group.options"
                    :key="option.value"
                    class="h-8 px-2.5 py-1.5 rounded inline-flex justify-start items-center gap-2 hover:bg-surface-900 transition-colors cursor-pointer"
                    @click="toggleTemplateFilter(group.key, option.value)"
                  >
                    <Checkbox
                      :model-value="isFilterSelected(group.key, option.value)"
                      :binary="true"
                      :pt="{
                        box: {
                          class: [
                            'w-4 h-4 rounded border border-checkbox-border-color bg-checkbox-background',
                            isFilterSelected(group.key, option.value) ? 'border-primary' : ''
                          ]
                        },
                        icon: { class: 'text-xs' }
                      }"
                      @click.stop
                      @change="toggleTemplateFilter(group.key, option.value)"
                    />
                    <span
                      class="flex-1 text-listbox-option-color text-xs font-normal font-['Sora']"
                    >
                      {{ option.label }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Resources Section Menu with Filters -->
          <div
            v-else-if="activeNav === 'resources' && !showMainMenu"
            class="flex flex-col gap-5"
          >
            <!-- Back to Resources Button -->
            <button
              class="w-64 h-8 px-2.5 py-1.5 rounded border surface-border inline-flex justify-start items-center gap-3 hover:surface-100 transition-colors"
              @click="goBackToMenu"
            >
              <i class="pi pi-angle-left" />
              <span
                class="flex-1 text-left text-listbox-option-focus-color text-xs font-normal font-['Sora']"
                >Resources</span
              >
            </button>

            <!-- Categories Filter -->
            <div class="flex flex-col gap-4">
              <div class="flex justify-between items-center h-5">
                <span class="text-Text-text-color-muted text-xs font-normal font-['Proto_Mono']"
                  >Categories</span
                >
              </div>
              <div class="flex flex-col gap-1">
                <div
                  v-for="category in categoryOptions"
                  :key="category.value"
                  class="h-8 px-2.5 py-1.5 rounded inline-flex justify-start items-center gap-2 hover:surface-100 transition-colors cursor-pointer"
                  @click="toggleCategory(category.value)"
                >
                  <Checkbox
                    :model-value="selectedCategories.includes(category.value)"
                    :binary="true"
                    :pt="{
                      box: {
                        class: [
                          'w-4 h-4 rounded border border-checkbox-border-color bg-checkbox-background',
                          selectedCategories.includes(category.value) ? 'border-primary' : ''
                        ]
                      },
                      icon: { class: 'text-xs' }
                    }"
                    @click.stop
                    @change="toggleCategory(category.value)"
                  />
                  <span
                    class="flex-1 text-listbox-option-color text-xs font-normal font-['Sora']"
                    >{{ category.label }}</span
                  >
                </div>
              </div>
            </div>
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
