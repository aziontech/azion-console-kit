<script setup>
  import PrimeButton from 'primevue/button'
  import PrimeInputText from 'primevue/inputtext'
  import LoadingState from './create-modal-block-loading-state.vue'
  import { computed, ref, inject, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { useAccountStore } from '@/stores/account'
  import { TEXT_DOMAIN_WORKLOAD } from '@/helpers'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'
  import { solutionService } from '@/services/v2/marketplace/solution-service'

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()

  /**@type {import('@/plugins/adapters/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({
    name: 'create-modal-block'
  })

  const accountStore = useAccountStore()
  const router = useRouter()
  const toast = useToast()

  // Reactive state
  const selectedTab = ref('recommended')
  const search = ref('')

  // Computed properties
  const hideCreateOptions = computed(() => accountStore.hasHideCreateOptionsFlag)
  const isSearching = computed(() => !!search.value.trim().length)

  // Constants
  const RESOURCES = [
    {
      label: `${handleTextDomainWorkload.pluralTitle}`,
      to: `/${handleTextDomainWorkload.pluralLabel}/create?origin=create`,
      description: 'Launch an application and set up security with digital certificates.'
    },
    {
      label: 'Application',
      to: '/edge-applications/create?origin=create',
      description: 'Deploy an application to deliver content from the edge.'
    },
    {
      label: 'Variables',
      to: '/variables/create',
      description: 'Create environment variables or secrets to use with configured Functions.'
    },
    {
      label: 'Edge DNS',
      to: '/edge-dns/create',
      description: 'Use an authoritative DNS server to host a domain.'
    },
    {
      label: 'Firewall',
      to: '/edge-firewall/create',
      description: 'Create security settings to protect applications against threats and attacks.'
    },
    {
      label: 'Edge Connector',
      to: '/edge-connectors/create',
      description:
        'Edge Connector centralizes connections and how to connect to machines and applications.'
    },
    {
      label: 'Custom Page',
      to: '/custom-pages/create',
      description:
        'Create custom page to display personalized error pages for specific HTTP errors.'
    },
    {
      label: 'Edge Nodes',
      to: '/edge-node/create',
      description: 'Create edge infrastructure, installing services and resources in real time.'
    },
    {
      label: 'Data Stream',
      to: '/data-stream/create',
      description: 'Feed streaming, SIEM, and big data platforms with the event logs from Azion.'
    },
    {
      label: 'Functions',
      to: '/edge-functions/create?origin=create',
      description: 'Create Functions to use with Application or Firewall.'
    },
    {
      label: 'Edge Services',
      to: '/edge-services/create',
      description: 'Create new services to define dependencies between edge resources.'
    },
    {
      label: 'Certificate Manager',
      to: '/digital-certificates/create',
      description: 'Add a digital certificate entry to secure HTTPS applications.'
    },
    {
      label: 'Network Lists',
      to: '/network-lists/create',
      description:
        'Add allowlists, blocklists, and greylists to use with Rules Engine for Firewall.'
    }
  ]

  const TAB_CONFIG = {
    recommended: { label: 'Recommended', title: 'Select a Template' },
    templates: { label: 'Templates', title: 'Select a Template' },
    newResource: { label: 'Resources', title: 'Select a Resource' },
    githubImport: { label: 'Import from GitHub', title: 'Import from GitHub' }
  }

  // Emits
  const emit = defineEmits('closeModal')

  // Initialize selected tab based on user flags
  if (hideCreateOptions.value) {
    selectedTab.value = 'newResource'
  }

  // Computed properties for data filtering
  const filteredResources = computed(() => {
    const v4OnlyResources = ['Edge Connector', 'Custom Page']
    return hasFlagBlockApiV4()
      ? RESOURCES.filter((resource) => !v4OnlyResources.includes(resource.label))
      : RESOURCES
  })

  const filteredTabs = computed(() => {
    return Object.entries(TAB_CONFIG)
      .filter(([key]) => key === 'newResource' || !hideCreateOptions.value)
      .map(([value, config]) => ({ ...config, value }))
  })

  // Query parameters
  const queryTypes = computed(() => ({
    recommended: hasFlagBlockApiV4()
      ? accountStore.accountData.jobRole
      : `${accountStore.accountData.jobRole}-v4`,
    templates: hasFlagBlockApiV4() ? 'onboarding' : 'onboarding-v4'
  }))

  // State management
  const solutions = ref({
    recommended: [],
    templates: [],
    githubImport: []
  })

  const loading = ref({
    recommended: false,
    templates: false,
    githubImport: false
  })

  const errors = ref({
    recommended: null,
    templates: null,
    githubImport: null
  })

  // Data loading with integrated persistence
  const loadQueries = () => {
    const queries = [
      {
        key: 'recommended',
        params: { group: 'recommended', type: queryTypes.value.recommended }
      },
      {
        key: 'templates',
        params: { group: 'templates', type: queryTypes.value.templates }
      },
      {
        key: 'githubImport',
        params: { group: 'githubImport', type: 'import-from-github' }
      }
    ]

    queries.forEach(({ key, params }) => {
      // Use service with integrated persistence and background refresh
      const result = solutionService.useListSolutions(params)

      solutions.value[key] = result.data
      loading.value[key] = result.isLoading
      errors.value[key] = result.error
    })
  }

  // Loading states
  const isLoading = computed(() => Object.values(loading.value).some(Boolean))

  const isInitialLoading = computed(
    () => isLoading.value && Object.values(solutions.value).every((arr) => !arr?.length)
  )

  const isCurrentTabLoading = computed(() => loading.value[selectedTab.value] || false)

  // Templates data
  const templatesData = computed(() => ({
    recommended: solutions.value.recommended || [],
    templates: solutions.value.templates || [],
    newResource: filteredResources.value,
    githubImport: solutions.value.githubImport || []
  }))

  const currentTabInfo = computed(() => {
    const config = TAB_CONFIG[selectedTab.value]
    return {
      show: true,
      title: config?.title || 'Select an Option'
    }
  })

  // Error handling
  const showError = (error, defaultMessage) => {
    if (!error) return

    toast.add({
      closable: true,
      severity: 'error',
      summary: 'Error',
      detail: error.message || defaultMessage
    })
  }

  const handleErrors = () => {
    const errorMessages = {
      recommended: 'Failed to load recommended solutions',
      templates: 'Failed to load templates',
      githubImport: 'Failed to load GitHub import solutions'
    }

    Object.entries(errors.value).forEach(([key, error]) => {
      showError(error, errorMessages[key])
    })
  }

  // Navigation functions
  const navigateAndClose = (route, selection, section = 'resources') => {
    tracker.create.selectedOnCreate({ section, selection })
    router.push(route)
    emit('closeModal')
  }

  const redirect = (toLink, selection) => {
    navigateAndClose(toLink, selection)
  }

  const redirectToSolution = (template, section) => {
    const params = {
      vendor: template.vendor.slug,
      solution: template.slug
    }
    navigateAndClose({ name: 'create-something-new', params }, template.name, section)
  }

  const redirectGithubImport = (template, section) => {
    const params = {
      vendor: template.vendor.slug,
      solution: template.slug
    }
    navigateAndClose({ name: 'github-repository-import', params }, template.name, section)
  }

  // Tab management
  const onTabChange = (target) => {
    resetFilters()
    selectedTab.value = target.value || selectedTab.value
  }

  // Item click handler
  const handleItemClick = (item) => {
    switch (selectedTab.value) {
      case 'recommended':
      case 'templates':
        redirectToSolution(item, selectedTab.value)
        break
      case 'newResource':
        redirect(item.to, item.label)
        break
      case 'githubImport':
        redirectGithubImport(item, 'githubImport')
        break
    }
  }

  // Search and filtering
  const resetFilters = () => {
    search.value = ''
  }

  const searchInTemplate = (template, filter) => {
    if (!template) return false

    const searchFields = ['name', 'headline', 'description', 'label']
    const nestedFields = { vendor: 'name', instanceType: 'name', category: 'name' }

    return Object.keys(template).some((key) => {
      const value = template[key]

      if (nestedFields[key]) {
        return value?.[nestedFields[key]]?.toLowerCase().includes(filter.toLowerCase())
      }

      if (searchFields.includes(key) && typeof value === 'string') {
        return value.toLowerCase().includes(filter.toLowerCase())
      }

      return false
    })
  }

  const validTemplates = computed(() => {
    const templates = templatesData.value[selectedTab.value] || []

    if (!Array.isArray(templates)) return []

    const filtered = search.value.trim()
      ? templates.filter((template) => searchInTemplate(template, search.value))
      : templates

    return filtered.filter((template) => template != null)
  })

  const resultsText = computed(() => {
    const count = validTemplates.value.length
    if (count === 0) return 'No results found.'
    if (count === 1) return '1 search result for'
    return `${count} search results for`
  })

  // Lifecycle
  onMounted(() => {
    loadQueries()
    handleErrors()
  })
</script>

<template>
  <div
    class="overflow-auto w-full h-full flex flex-col sm:flex-row gap-4"
    data-testid="integrations-list-container"
  >
    <!-- Sidebar Navigation -->
    <nav
      class="-ml-2 sm:min-w-[240px]"
      data-testid="integrations-list-menu"
    >
      <ul
        class="flex flex-col gap-1 md:fixed md:w-60"
        data-testid="integrations-list-menu-items"
      >
        <li
          v-for="tab in filteredTabs"
          :key="tab.value"
        >
          <PrimeButton
            :class="{ 'surface-200': tab.value === selectedTab }"
            class="w-full whitespace-nowrap h-[38px] flex"
            text
            size="small"
            :pt="{ label: { class: 'w-full text-left' } }"
            @click="onTabChange(tab)"
            :label="tab.label"
            data-testid="integrations-list-menu-item"
          />
        </li>
      </ul>
    </nav>

    <!-- Main Content -->
    <main
      class="overflow-auto w-full flex flex-col"
      data-testid="integrations-list-content"
    >
      <LoadingState v-if="isInitialLoading" />

      <div
        v-else
        class="flex flex-col gap-5 mb-5 w-full"
        data-testid="integrations-list-content-body"
      >
        <!-- Header -->
        <header
          class="flex flex-col gap-3"
          data-testid="integrations-list-content-header"
        >
          <div class="text-base font-medium flex items-center gap-2">
            {{ currentTabInfo.title }}
            <i
              v-if="isCurrentTabLoading"
              class="pi pi-spin pi-spinner text-sm text-primary"
            />
          </div>

          <!-- Search Input -->
          <span
            v-if="selectedTab !== 'githubImport'"
            class="p-input-icon-left"
            data-testid="integrations-list-content-search"
          >
            <i class="pi pi-search" />
            <PrimeInputText
              class="w-full"
              type="text"
              placeholder="Search by name, framework, or keyword"
              v-model="search"
            />
          </span>
        </header>

        <!-- Search Results Info -->
        <div
          v-if="isSearching"
          class="text-sm"
        >
          <template v-if="validTemplates.length">
            {{ resultsText }}
            <span class="font-medium">"{{ search }}"</span>
          </template>
          <template v-else>
            <span>{{ resultsText }}</span>
            <PrimeButton
              label="Back to the list."
              link
              class="ml-3 p-0"
              size="small"
              @click="resetFilters"
              data-testid="integrations-list-content-search-results-see-all"
            />
          </template>
        </div>
      </div>
      <!-- Content Grid -->
      <div
        v-if="validTemplates.length"
        class="mx-0 w-full mt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        :data-testid="`integrations-list-content-${selectedTab}`"
      >
        <!-- Template Cards -->
        <PrimeButton
          v-for="item in validTemplates"
          :key="item.id || item.to || Math.random()"
          @click="handleItemClick(item)"
          class="p-6 text-left border-solid border surface-border hover:border-primary transition-all"
          link
          :data-testid="`integrations-list-content-${selectedTab}-item`"
        >
          <div class="flex flex-col h-full justify-between gap-3.5 items-start">
            <div class="flex gap-3.5 flex-col">
              <!-- Icon -->
              <div
                class="w-10 h-10 rounded surface-border border flex justify-center items-center overflow-hidden box-border"
                :class="{ 'bg-black': selectedTab === 'githubImport' }"
              >
                <div
                  v-if="selectedTab !== 'githubImport'"
                  class="bg-white flex h-full w-full rounded"
                >
                  <img
                    class="object-contain"
                    :src="item.vendor?.icon"
                    :alt="item.vendor?.name || item.name"
                  />
                </div>
                <i
                  v-else
                  class="pi pi-github text-white text-2xl"
                />
              </div>

              <!-- Content -->
              <div class="flex flex-col">
                <span class="line-clamp-1 h-5 text-color text-sm font-medium">
                  {{ item.name || item.label }}
                </span>
                <span
                  class="h-10 pb-4 text-sm font-normal text-color-secondary mt-1.5 line-clamp-2"
                >
                  {{
                    item.headline ||
                    item.description ||
                    "Import an existing project to deploy it on Azion's edge."
                  }}
                </span>
              </div>
            </div>
          </div>
        </PrimeButton>
      </div>
    </main>
  </div>
</template>
