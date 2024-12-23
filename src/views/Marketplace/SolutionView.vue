<template>
  <ContentBlock v-if="solution">
    <template #heading>
      <PageHeadingBlock :pageTitle="solution.name" />
      <!-- Solutions props -->
      <div class="flex flex-col sm:flex-row gap-4 sm:items-center">
        <div
          class="w-10 h-10 hidden sm:flex rounded surface-border border justify-center items-center bg-white"
        >
          <img
            class="rounded"
            :src="solution.vendor.icon"
            alt=""
          />
        </div>
        <div class="flex gap-3 items-center">
          <div class="gap-1 items-center hidden sm:flex">
            <span class="text-xs font-medium text-color-primary">By</span>
            <PrimeButton
              link
              class="px-0 py-1"
              :label="solution.vendor.name"
              icon="pi pi-external-link"
              iconPos="right"
              size="small"
              @click="openVendorSite"
            />
          </div>
          <div class="flex gap-1 items-center">
            <span class="text-xs font-medium text-color-primary">Version</span>
            <span class="text-xs font-medium text-color-secondary">{{ solution.version }}</span>
          </div>
          <div class="flex gap-1 items-center">
            <span class="text-xs font-medium text-color-primary">Last Updated</span>
            <span class="text-xs font-medium text-color-secondary">{{ solution.lastUpdate }}</span>
          </div>
        </div>
      </div>
    </template>
    <template #content>
      <div
        class="flex flex-col-reverse justify-start lg:flex-row lg:justify-between gap-6 sm:gap-8 lg:gap-16 mt-4"
      >
        <!-- Content -->
        <div
          class="w-full lg:max-w-3xl flex flex-col gap-8 p-6 sm:p-8 lg:p-14 border rounded surface-border"
        >
          <div>
            <div class="text-xl font-medium mb-2">Overview</div>
            <div v-html="solution.overview"></div>
          </div>
          <div>
            <div class="text-xl font-medium mb-2">Usage</div>
            <div v-html="solution.usage"></div>
          </div>
          <div>
            <div class="text-xl font-medium mb-2">Changelog</div>
            <div>
              [{{ solution.latestVersion }}] - {{ solution.lastUpdate }} -
              {{ solution.latestVersionChangelog }}
            </div>
          </div>
          <div>
            <div class="text-xl font-medium mb-2">Support</div>
            <div v-html="solution.support"></div>
          </div>
        </div>
        <!-- Right Sidebar -->
        <div class="flex flex-col gap-6 w-full lg:max-w-md lg:sticky lg:top-24 self-start">
          <!-- Card -->
          <div class="p-6 sm:p-8 border rounded surface-border">
            <div class="text-xl font-medium mb-3">{{ sidebarTitle }}</div>
            <p class="text-base text-color-secondary mb-8">
              {{ sidebarDescription }}
              <PrimeButton
                label="Read more"
                link
                size="small"
                class="p-0"
                v-if="solution.isLaunched"
                @click="openNewWindow('https://www.azion.com/en/documentation/products/marketplace/integrations/')"
              />
            </p>
            <InlineMessage
              class="w-full"
              :class="{ 'animate-fadeIn': !animateMessage.value }"
              severity="success"
              v-if="isLastVersion"
              >Latest version installed!</InlineMessage
            >
            <PrimeButton
              v-else
              class="w-full"
              :label="sidebarButtonLabel"
              @click="startLaunchSolution"
              :loading="loading"
              icon-pos="right"
              :icon="loadIcon"
            />
          </div>
          <!-- Details -->
          <div>
            <div class="text-lg font-medium mb-3">Details</div>
            <div class="h-8 w-full flex flex-row justify-between align-items-center">
              <span class="text-sm text-color-secondary">Website</span>
              <PrimeButton
                class="p-0 text-right"
                :label="solution.vendor.url"
                size="small"
                link
                icon="pi pi-external-link"
                iconPos="right"
                @click="openVendorSite"
              />
            </div>
            <Divider class="my-2" />
            <div class="h-8 w-full flex flex-row justify-between align-items-center">
              <span class="text-sm text-color-secondary flex-shrink-0">Need help?</span>
              <PrimeButton
                class="p-0 text-right"
                label="Azion Sales Team"
                size="small"
                link=""
                icon="pi pi-external-link"
                iconPos="right"
                @click="openNewWindow('https://www.azion.com/en/contact-sales/')"
              />
            </div>
          </div>
        </div>
      </div>

      <IntegrationInstall
        v-if="solution"
        v-model:visible="showIntegration"
        :solution="solution"
        :availableApps="availableApps"
        :getTemplateService="props.getTemplateService"
        :instantiateTemplateService="props.instantiateTemplateService"
        :checkStatusScriptRunnerService="props.checkStatusScriptRunnerService"
        :windowOpen="props.windowOpen"
        :loadingEdges="loadingEdges"
        v-model:showSidebarSecond="showCreateEdgeApp"
        @success="handleIntegrationSuccess"
        @fail="handleIntegrationFail"
        @loading="handleLoading"
      />
      <CreateEdgeApplication v-model:visible="showCreateEdgeApp" />
    </template>
  </ContentBlock>
</template>

<script setup>
  import { computed, onBeforeMount, ref } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import InlineMessage from 'primevue/inlinemessage'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { useLoadingStore } from '@/stores/loading'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import IntegrationInstall from './drawer/IntegrationInstall'
  import CreateEdgeApplication from './drawer/CreateEdgeApplication'

  const ERROR_PROPS = {
    closable: true,
    severity: 'error'
  }

  const solution = ref()
  const loading = ref(false)
  const loadingEdges = ref(false)
  const showIntegration = ref(false)
  const animateMessage = ref(false)
  const showCreateEdgeApp = ref(false)
  const availableApps = ref([])
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const breadcrumbs = useBreadcrumbs()

  const props = defineProps({
    loadSolutionService: {
      type: Function,
      required: true
    },
    listEdgeApplicationsAvailablesService: {
      type: Function,
      required: true
    },
    getTemplateService: {
      type: Function,
      required: true
    },
    windowOpen: {
      type: Function,
      required: true
    },
    launchSolutionService: {
      type: Function,
      required: true
    },
    instantiateTemplateService: {
      type: Function,
      required: true
    },
    checkStatusScriptRunnerService: {
      type: Function,
      required: true
    }
  })

  onBeforeMount(async () => {
    const stores = useLoadingStore()
    stores.startLoading()
    await loadSolution()
    listEdgeApplicationsAvailables()
    animateMessage.value = !isLastVersion.value

    const solutionBran = {
      label: solution.value.name,
      to: route.path
    }
    breadcrumbs.update([...route.meta.breadCrumbs, solutionBran])
    stores.finishLoading()
  })

  const loadSolution = async () => {
    try {
      solution.value = await props.loadSolutionService({
        vendor: route.params.vendor,
        solution: route.params.solution
      })
    } catch (error) {
      toast.add({ ...ERROR_PROPS, summary: error })
    }
  }

  const openVendorSite = () => {
    props.windowOpen(solution.value.vendor.url, '_blank')
  }

  const openNewWindow = (url) => {
    props.windowOpen(url, '_blank')
  }

  const startLaunchSolution = () => {
    if (!solution.value.newLaunchFlow) {
      launchSolution()
    } else {
      showIntegration.value = true
    }
  }

  const showFeedback = (feedback) => {
    toast.add({
      closable: true,
      severity: 'success',
      summary: feedback,
      action: {
        link: {
          label: 'Go to Edge Functions',
          callback: () => {
            router.push({ name: 'list-edge-functions' })
          }
        }
      }
    })
  }

  const launchSolution = async () => {
    try {
      loading.value = true

      const params = {
        vendor: solution.value.vendor.slug,
        solution: solution.value.slug
      }
      const { feedback } = await props.launchSolutionService(params)

      reloadSolution(feedback)
    } catch (error) {
      toast.add({ ...ERROR_PROPS, summary: error })
    }
  }

  const handleIntegrationSuccess = async (feedback) => {
    showIntegration.value = false
    reloadSolution(feedback)
    listEdgeApplicationsAvailables()
  }

  const handleIntegrationFail = async (error) => {
    showIntegration.value = false
    loading.value = false
    toast.add({ ...ERROR_PROPS, summary: error })
    await loadSolution()
  }

  const reloadSolution = (feedback) => {
    setTimeout(async () => {
      await loadSolution()
      loading.value = false
      showFeedback(feedback)
    }, 150)
  }

  const listEdgeApplicationsAvailables = async () => {
    loadingEdges.value = true
    const payload = {
      vendor: solution.value.vendor.slug,
      solution: solution.value.slug
    }
    availableApps.value = await props.listEdgeApplicationsAvailablesService(payload)
    loadingEdges.value = false
  }

  const handleLoading = () => {
    loading.value = true
  }

  const isLastVersion = computed(() => {
    const { isLaunched, isUpdated, newLaunchFlow } = solution.value
    return isLaunched && isUpdated && !newLaunchFlow
  })

  const isOutdated = computed(() => {
    const { isLaunched, isUpdated } = solution.value
    return isLaunched && !isUpdated
  })

  const sidebarTitle = computed(() => {
    if (isLastVersion.value) {
      return 'Successfully installed!'
    }
    if (solution.value.isBringYourOwnLicense) {
      return 'Bring Your Own License'
    }
    if (solution.value.isPayAsYouGo) {
      return 'Buy to Subscribe'
    }
    return 'Free License'
  })

  const sidebarDescription = computed(() => {
    if (isLastVersion.value) {
      return 'Configure it for optimal performance and define settings for a customized experience.'
    }
    if (solution.value.isBringYourOwnLicense) {
      return 'Bring a previously purchased license and use it to run this integration on Azion Edge Computing Platform.'
    }
    if (solution.value.isPayAsYouGo) {
      return 'Buy and launch this integration instantly. Total pricing per instance for services is hosted on t2.small in US East (N. Virginia).'
    }
    return 'Install this integration using the available free model.'
  })

  const sidebarButtonLabel = computed(() => {
    if (isOutdated.value) return 'Get New Version'
    return 'Install'
  })

  const loadIcon = computed(() => {
    return loading.value ? 'pi pi-spin pi-spinner' : ''
  })
</script>
