<script setup>
  import PrimeButton from 'primevue/button'
  import PrimeInputText from 'primevue/inputtext'
  import LoadingState from './create-modal-block-loading-state.vue'
  import { computed, onMounted, ref, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { useAccountStore } from '@/stores/account'
  import { TOAST_LIFE } from '@/utils/constants'

  /**@type {import('@/plugins/adapters/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  defineOptions({
    name: 'create-modal-block'
  })
  const props = defineProps({
    listSolutionsService: {
      type: Function,
      required: true
    }
  })

  const RESOURCES = [
    {
      label: 'Domains',
      to: '/domains/create?origin=create',
      description: 'Launch an edge application and set up security with digital certificates.'
    },
    {
      label: 'Edge Application',
      to: '/edge-applications/create?origin=create',
      description: 'Deploy an edge application to deliver content from the edge.'
    },
    {
      label: 'Variables',
      to: '/variables/create',
      description: 'Create environment variables or secrets to use with configured edge functions.'
    },
    {
      label: 'Edge DNS',
      to: '/edge-dns/create',
      description: 'Use an authoritative DNS server to host a domain.'
    },
    {
      label: 'Edge Firewall',
      to: '/edge-firewall/create',
      description: 'Create security settings to protect applications against threats and attacks.'
    },
    {
      label: 'Edge Nodes',
      to: '/edge-node/create',
      description: 'Create edge infrastructure, installing services and resources in real time.'
    },
    {
      label: 'Data Stream',
      to: '/data-stream/create',
      description: 'Feed streamimg, SIEM, and big data platforms with the event logs from Azion.'
    },
    {
      label: 'Edge Functions',
      to: '/edge-functions/create?origin=create',
      description: 'Create edge functions to use with Edge Application or Edge Firewall.'
    },
    {
      label: 'Edge Services',
      to: '/edge-services/create',
      description: 'Create new services to define dependencies between edge resources.'
    },
    {
      label: 'Digital Certificates',
      to: '/digital-certificates/create',
      description: 'Add a digital certificate entry to secure HTTPS edge applications.'
    },
    {
      label: 'Network Lists',
      to: '/network-lists/create',
      description:
        'Add allowlists, blocklists, and greylists to use with Rules Engine for Edge Firewall.'
    }
  ]

  const TABS = [
    {
      label: 'Recommended',
      value: 'recommended'
    },
    {
      label: 'Templates',
      value: 'browse'
    },
    {
      label: 'Resources',
      value: 'newResource'
    },
    {
      label: 'Import from GitHub',
      value: 'importGithub'
    }
  ]

  const emit = defineEmits('closeModal')

  onMounted(async () => {
    await loadRecommendedSolutions()
  })

  const router = useRouter()
  const toast = useToast()

  const isLoading = ref(false)
  const selectedTab = ref('recommended')
  const search = ref('')
  const searching = computed(() => !!search.value.trim().length)

  const templatesData = ref({
    recommended: [],
    browse: [],
    newResource: RESOURCES,
    importGithub: []
  })

  const tabInfo = computed(() => {
    return {
      recommended: { show: selectedTab.value === 'recommended', title: 'Select a Template' },
      browse: { show: selectedTab.value === 'browse', title: 'Select a Template' },
      newResource: { show: selectedTab.value === 'newResource', title: 'Select a Resource' },
      importGithub: { show: selectedTab.value === 'importGithub', title: 'Import from GitHub' }
    }
  })

  const toastBuilder = (severity, detail) => {
    if (!detail) return
    const options = {
      closable: true,
      severity,
      summary: severity,
      detail
    }

    if (severity === 'success') {
      options.life = TOAST_LIFE
    }

    toast.add(options)
  }

  const loadSolutions = async ({ group, type = null }) => {
    try {
      isLoading.value = true
      templatesData.value[group] = await props.listSolutionsService({ group, type })
    } catch (error) {
      toastBuilder('error', error)
    } finally {
      isLoading.value = false
    }
  }

  const loadRecommendedSolutions = async () => {
    const accountStore = useAccountStore().accountData
    await loadSolutions({ group: 'recommended', type: accountStore.jobRole })
  }

  const loadBrowse = async () => {
    await loadSolutions({ group: 'browse' })
  }

  const loadImportGithubSolution = async () => {
    await loadSolutions({ group: 'importGithub', type: 'import-from-github' })
  }

  const redirect = (toLink, selection) => {
    tracker.create.selectedOnCreate({
      section: 'resources',
      selection
    })
    router.push(toLink)
    emit('closeModal')
  }

  const redirectToSolution = (template, section) => {
    tracker.create.selectedOnCreate({
      section,
      selection: template.name
    })
    const params = {
      vendor: template.vendor.slug,
      solution: template.slug
    }
    router.push({ name: 'create-something-new', params })
    emit('closeModal')
  }

  const redirectGithubImport = (template, section) => {
    tracker.create.selectedOnCreate({
      section,
      selection: template.name
    })
    const params = {
      vendor: template.vendor.slug,
      solution: template.slug
    }

    router.push({ name: 'github-repository-import', params })
    emit('closeModal')
  }

  const onTabChange = async (target) => {
    if (isLoading.value) {
      return
    }

    selectedTab.value = target.value || selectedTab.value
    if (target.value === 'browse' && templatesData.value.browse.length === 0) {
      await loadBrowse()
    } else if (target.value === 'importGithub' && templatesData.value.importGithub.length === 0) {
      await loadImportGithubSolution()
    }
  }

  const filterBySearchField = () => {
    if (!search.value.trim()) return templatesData.value[selectedTab.value]

    return templatesData.value[selectedTab.value].filter((template) => {
      return Object.keys(template).some((key) => {
        const props = { template, key, filter: search.value }

        if (key === 'vendor' || key === 'instance_type') {
          return findTemplatesByFilter({ ...props, nestedKey: 'name' })
        }

        if (typeof template[key] !== 'string') return

        return findTemplatesByFilter(props)
      })
    })
  }

  const findTemplatesByFilter = ({ template, key, filter, nestedKey = null }) => {
    if (nestedKey) {
      return template[key][nestedKey].toLowerCase().includes(filter.toLowerCase())
    }

    return template[key].toLowerCase().includes(filter.toLowerCase())
  }

  const filteredTemplates = computed(() => {
    return filterBySearchField()
  })

  const resetFilters = () => {
    search.value = ''
  }

  const resultsText = computed(() => {
    const options = {
      zero: 'No results found.',
      one: '1 search result for',
      multiple: `${filteredTemplates.value.length} search results for`
    }

    if (!filteredTemplates.value.length) return options.zero
    if (filteredTemplates.value.length === 1) return options.one
    return options.multiple
  })
</script>

<template>
  <div class="overflow-auto w-full h-full flex flex-col sm:flex-row gap-4">
    <div class="-ml-2 sm:min-w-[240px]">
      <ul class="flex flex-col gap-1 md:fixed md:w-60">
        <li
          v-for="(menuitem, index) in TABS"
          :key="index"
        >
          <PrimeButton
            :class="{ 'surface-200': menuitem.value === selectedTab, 'p-disabled': isLoading }"
            class="w-full whitespace-nowrap h-[38px] flex"
            text
            size="small"
            :pt="{
              label: { class: 'w-full text-left' }
            }"
            @click="onTabChange(menuitem)"
            :label="menuitem.label"
          />
        </li>
      </ul>
    </div>

    <div class="overflow-auto w-full flex flex-col">
      <LoadingState v-if="isLoading" />
      <div
        class="flex flex-col gap-5 mb-5 w-full"
        v-else
      >
        <div class="flex flex-col gap-3">
          <div class="text-base font-medium">
            {{ tabInfo[selectedTab].title }}
          </div>
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <PrimeInputText
              class="w-full"
              type="text"
              placeholder="Search by name, framework, or keyword"
              v-model="search"
              @input="filterBySearchField"
            />
          </span>
        </div>
        <template v-if="searching">
          <template v-if="!!filteredTemplates.length">
            <div class="text-sm">
              {{ resultsText }}
              <span class="font-medium">“{{ search }}”</span>
            </div>
          </template>
          <template v-else>
            <div class="text-sm">
              <span>{{ resultsText }}</span>
              <PrimeButton
                label="See full integrations list."
                link
                class="ml-3 p-0"
                size="small"
                @click="resetFilters"
              />
            </div>
          </template>
        </template>
      </div>

      <div
        class="mx-0 w-full mt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        v-if="tabInfo.recommended.show"
      >
        <PrimeButton
          v-for="template in filteredTemplates"
          :key="template.id"
          @click="redirectToSolution(template, 'recommended')"
          class="p-6 text-left border-solid border surface-border hover:border-primary transition-all"
          link
        >
          <div class="flex flex-col h-full justify-between gap-3.5 items-start">
            <div class="flex gap-3.5 flex-col">
              <div
                class="w-10 h-10 rounded surface-border border flex justify-center items-center bg-white"
              >
                <img
                  class="rounded"
                  :src="template.vendor.icon"
                  :alt="template.vendor.name"
                />
              </div>
              <div class="flex flex-col">
                <span class="line-clamp-1 h-5 text-color text-sm font-medium">
                  {{ template.name }}
                </span>
                <span
                  class="h-10 pb-4 text-sm font-normal text-color-secondary mt-1.5 line-clamp-2"
                >
                  {{ template.headline }}
                </span>
              </div>
            </div>
          </div>
        </PrimeButton>
      </div>
      <div
        class="mx-0 w-full mt-0 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4"
        v-if="tabInfo.browse.show"
      >
        <PrimeButton
          v-for="template in filteredTemplates"
          :key="template.id"
          @click="redirectToSolution(template, 'templates')"
          class="p-6 text-left border-solid border surface-border hover:border-primary transition-all"
          link
        >
          <div class="flex flex-col h-full justify-between gap-3.5 items-start">
            <div class="flex gap-3.5 flex-col">
              <div
                class="w-10 h-10 rounded surface-border border flex justify-center items-center bg-white"
              >
                <img
                  class="rounded"
                  :src="template.vendor.icon"
                  :alt="template.name"
                />
              </div>
              <div class="flex flex-col">
                <span class="line-clamp-1 h-5 text-color text-sm font-medium">
                  {{ template.name }}
                </span>
                <span
                  class="h-10 pb-4 text-sm font-normal text-color-secondary mt-1.5 line-clamp-2"
                >
                  {{ template.headline }}
                </span>
              </div>
            </div>
          </div>
        </PrimeButton>
      </div>
      <div
        class="mx-0 w-full mt-0 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4"
        v-if="tabInfo.newResource.show"
      >
        <PrimeButton
          v-for="resource in filteredTemplates"
          :key="resource.to"
          @click="redirect(resource.to, resource.label)"
          class="p-6 text-left border-solid border surface-border hover:border-primary transition-all"
          link
        >
          <div class="flex flex-col h-full justify-between gap-3.5 items-start">
            <div class="flex gap-3.5 flex-col">
              <div class="flex flex-col">
                <span class="line-clamp-1 h-5 text-color text-sm font-medium">
                  {{ resource.label }}
                </span>
                <span
                  class="h-10 pb-4 text-sm font-normal text-color-secondary mt-1.5 line-clamp-2"
                >
                  {{ resource.description }}
                </span>
              </div>
            </div>
          </div>
        </PrimeButton>
      </div>
      <div
        class="mx-0 w-full mt-0 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4"
        v-if="tabInfo.importGithub.show"
      >
        <PrimeButton
          v-for="(template, index) in filteredTemplates"
          :key="index"
          @click="redirectGithubImport(template, 'githubImport')"
          class="p-6 text-left border-solid border surface-border hover:border-primary transition-all"
          link
        >
          <div class="flex flex-col h-full justify-between gap-3.5 items-start">
            <div class="flex gap-3.5 flex-col">
              <div
                class="w-10 h-10 rounded surface-border border flex justify-center items-center bg-black"
              >
                <i class="pi pi-github text-white text-2xl"></i>
              </div>
              <div class="flex flex-col">
                <span class="line-clamp-1 h-5 text-color text-sm font-medium">
                  {{ template.name }}
                </span>
                <span
                  class="h-10 pb-4 text-sm font-normal text-color-secondary mt-1.5 line-clamp-2"
                >
                  Import an existing project to deploy it on Azion's edge.
                </span>
              </div>
            </div>
          </div>
        </PrimeButton>
      </div>
    </div>
  </div>
</template>
