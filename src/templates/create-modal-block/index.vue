<script setup>
  import PrimeButton from 'primevue/button'
  import LoadingState from './create-modal-block-loading-state.vue'
  import { computed, onBeforeMount, ref, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { useAccountStore } from '@/stores/account'
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

  const emit = defineEmits('closeModal')

  onBeforeMount(async () => {
    await loadRecommendedSolutions()
  })

  const router = useRouter()
  const toast = useToast()

  const isLoading = ref(false)
  const templates = ref([])
  const browseTemplates = ref([])
  const selectedTab = ref('recommended')

  const items = ref([
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
      value: 'new_resource'
    },
    {
      label: 'Import from GitHub',
      value: 'import_github'
    }
  ])
  const resources = ref([
    {
      label: 'Domains',
      to: '/domains/create',
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
      to: '/edge-functions/create',
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
  ])

  const githubOptions = ref([
    {
      label: 'Import Static Site from GitHub',
      icon: 'pi pi-github',
      description: `Import an existing static project to deploy it on Azion's edge.`,
      command: () => {
        redirectGithubImport()
      }
    }
  ])

  const redirectGithubImport = () => {
    router.push({ name: 'github-static' })
    emit('closeModal')
  }

  const showRecommended = computed(() => {
    return selectedTab.value === 'recommended'
  })
  const showBrowse = computed(() => {
    return selectedTab.value === 'browse'
  })
  const showResource = computed(() => {
    return selectedTab.value === 'new_resource'
  })
  const showGithubImport = computed(() => {
    return selectedTab.value === 'import_github'
  })

  const showToast = (severity, detail) => {
    if (!detail) return
    toast.add({
      closable: true,
      severity,
      summary: severity,
      detail
    })
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

  const redirect = (toLink, selection) => {
    tracker.create.selectedOnCreate({
      section: 'resources',
      selection
    })
    router.push(toLink)
    emit('closeModal')
  }

  const loadRecommendedSolutions = async () => {
    try {
      isLoading.value = true
      const accountStore = useAccountStore().accountData
      templates.value = await props.listSolutionsService({ type: accountStore.jobRole })
    } catch (error) {
      showToast('error', error)
    } finally {
      isLoading.value = false
    }
  }

  const loadBrowse = async () => {
    try {
      isLoading.value = true
      browseTemplates.value = await props.listSolutionsService({})
    } catch (error) {
      showToast('error', error)
    } finally {
      isLoading.value = false
    }
  }

  const onTabChange = async (target) => {
    if (!isLoading.value) {
      selectedTab.value = target.value || selectedTab.value
      if (target.value === 'browse' && browseTemplates.value.length === 0) {
        await loadBrowse()
      }
    }
  }
</script>

<template>
  <div class="overflow-auto w-full h-full flex flex-col sm:flex-row p-0 sm:pl-5 sm:pr-8 gap-4 pb-4">
    <div class="sm:min-w-[240px] mt-4">
      <ul class="flex flex-col gap-1 md:fixed md:w-60">
        <li
          v-for="(menuitem, index) in items"
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
      <div v-else>
        <div class="text-base font-medium mt-5 mb-3">
          Select a {{ showResource ? 'Resource' : 'Template' }}
        </div>
      </div>

      <div
        class="mx-0 w-full mt-0 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4"
        v-if="showRecommended"
      >
        <PrimeButton
          v-for="template in templates"
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
        class="mx-0 w-full mt-0 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4"
        v-if="showBrowse"
      >
        <PrimeButton
          v-for="template in browseTemplates"
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
        class="mx-0 w-full mt-0 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4"
        v-if="showResource"
      >
        <PrimeButton
          v-for="resource in resources"
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
        class="mx-0 w-full mt-0 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4"
        v-if="showGithubImport"
      >
        <PrimeButton
          v-for="(template, index) in githubOptions"
          :key="index"
          @click="template.command()"
          class="p-6 text-left border-solid border surface-border hover:border-primary transition-all"
          link
        >
          <div class="flex flex-col h-full justify-between gap-3.5 items-start">
            <div class="flex gap-3.5 flex-col">
              <div
                class="w-10 h-10 rounded surface-border border flex justify-center items-center bg-black"
              >
                <i
                  :class="template.icon"
                  class="text-white text-2xl"
                ></i>
              </div>
              <div class="flex flex-col">
                <span class="line-clamp-1 h-5 text-color text-sm font-medium">
                  {{ template.label }}
                </span>
                <span
                  class="h-10 pb-4 text-sm font-normal text-color-secondary mt-1.5 line-clamp-2"
                >
                  {{ template.description }}
                </span>
              </div>
            </div>
          </div>
        </PrimeButton>
      </div>
    </div>
  </div>
</template>
