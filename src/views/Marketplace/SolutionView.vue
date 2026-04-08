<template>
  <ContentBlock>
    <template #heading>
      <template v-if="solution">
        <PageHeadingBlock
          :pageTitle="solution.name"
          :entityName="solution.name"
        />
        <!-- Solutions props -->
        <div class="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div
            v-if="solution.vendor?.icon"
            class="w-10 h-10 hidden sm:flex rounded surface-border border justify-center items-center bg-white"
          >
            <img
              class="rounded"
              :src="solution.vendor.icon"
              alt=""
            />
          </div>
          <div class="flex gap-3 items-center">
            <div
              v-if="solution.vendor?.name"
              class="gap-1 items-center hidden sm:flex"
            >
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
              <Skeleton
                v-if="!solutionVersion"
                width="3rem"
                height="1rem"
              />
              <span
                v-else
                class="text-xs font-medium text-color-secondary"
                >{{ solutionVersion }}</span
              >
            </div>
            <div
              v-if="solution.lastUpdate"
              class="flex gap-1 items-center"
            >
              <span class="text-xs font-medium text-color-primary">Last Updated</span>
              <span class="text-xs font-medium text-color-secondary">{{
                solution.lastUpdate
              }}</span>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <Skeleton
          width="12rem"
          height="1.5rem"
          class="mb-4"
        />
        <div class="flex gap-3 items-center">
          <Skeleton
            width="6rem"
            height="1rem"
          />
          <Skeleton
            width="4rem"
            height="1rem"
          />
          <Skeleton
            width="8rem"
            height="1rem"
          />
        </div>
      </template>
    </template>
    <template #content>
      <div
        class="flex flex-col-reverse justify-start lg:flex-row lg:justify-between gap-6 sm:gap-8 lg:gap-16 mt-4"
      >
        <!-- Content -->
        <div
          class="w-full surface-section lg:max-w-3xl flex flex-col gap-8 p-6 sm:p-8 lg:p-14 border rounded surface-border"
        >
          <div>
            <div class="text-xl font-medium mb-2">Overview</div>
            <template v-if="!isFullyLoaded">
              <Skeleton
                width="100%"
                height="1rem"
                class="mb-2"
              />
              <Skeleton
                width="90%"
                height="1rem"
                class="mb-2"
              />
              <Skeleton
                width="95%"
                height="1rem"
              />
            </template>
            <div
              v-else
              v-html="solution.overview"
            ></div>
          </div>
          <div>
            <div class="text-xl font-medium mb-2">Usage</div>
            <template v-if="!isFullyLoaded">
              <Skeleton
                width="100%"
                height="1rem"
                class="mb-2"
              />
              <Skeleton
                width="85%"
                height="1rem"
                class="mb-2"
              />
              <Skeleton
                width="92%"
                height="1rem"
              />
            </template>
            <div
              v-else
              v-html="solution.usage"
            ></div>
          </div>
          <div>
            <div class="text-xl font-medium mb-2">Changelog</div>
            <template v-if="!isFullyLoaded">
              <Skeleton
                width="80%"
                height="1rem"
              />
            </template>
            <div v-else>
              [{{ solution.latestVersion }}] - {{ solution.lastUpdate }} -
              {{ solution.latestVersionChangelog }}
            </div>
          </div>
          <div>
            <div class="text-xl font-medium mb-2">Support</div>
            <template v-if="!isFullyLoaded">
              <Skeleton
                width="100%"
                height="1rem"
                class="mb-2"
              />
              <Skeleton
                width="75%"
                height="1rem"
              />
            </template>
            <div
              v-else
              v-html="solution.support"
            ></div>
          </div>
        </div>
        <!-- Right Sidebar -->
        <div class="flex flex-col gap-6 w-full lg:max-w-md lg:sticky lg:top-24 self-start">
          <!-- Card -->
          <div class="p-6 sm:p-8 border surface-section rounded surface-border">
            <template v-if="!isFullyLoaded">
              <Skeleton
                width="60%"
                height="1.5rem"
                class="mb-3"
              />
              <Skeleton
                width="100%"
                height="1rem"
                class="mb-2"
              />
              <Skeleton
                width="90%"
                height="1rem"
                class="mb-8"
              />
              <Skeleton
                width="100%"
                height="2.5rem"
                borderRadius="6px"
              />
            </template>
            <template v-else>
              <div class="text-xl font-medium mb-3">{{ sidebarTitle }}</div>
              <p class="text-base text-color-secondary mb-8">
                {{ sidebarDescription }}
                <PrimeButton
                  label="Read more"
                  link
                  size="small"
                  class="p-0"
                  v-if="solution.isLaunched"
                  @click="openMarketplaceIntegrationsDocumentation()"
                />
              </p>
              <InlineMessage
                class="w-full animate-fadeIn"
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
            </template>
          </div>
          <!-- Details -->
          <div>
            <div class="text-lg font-medium mb-3">Details</div>
            <div class="h-8 w-full flex flex-row justify-between align-items-center">
              <span class="text-sm text-color-secondary">Website</span>
              <Skeleton
                v-if="!solution?.vendor?.url"
                width="8rem"
                height="1rem"
              />
              <PrimeButton
                v-else
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
                link
                icon="pi pi-external-link"
                iconPos="right"
                @click="contactSalesEdgeApplicationService()"
              />
            </div>
          </div>
        </div>
      </div>

      <IntegrationInstall
        v-if="isFullyLoaded"
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
  import PrimeButton from '@aziontech/webkit/button'
  import Divider from '@aziontech/webkit/divider'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { useLoadingStore } from '@/stores/loading'
  import IntegrationInstall from './drawer/IntegrationInstall'
  import CreateEdgeApplication from './drawer/CreateEdgeApplication'
  import { contactSalesEdgeApplicationService } from '@/services/edge-application-services/contact-sales-service.js'
  import { marketplaceService } from '@/services/v2/marketplace/marketplace-service'

  const ERROR_PROPS = {
    closable: true,
    severity: 'error',
    summary: 'Error'
  }

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
    windowManager: {
      type: Object,
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

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const loadingStore = useLoadingStore()

  const initialData = marketplaceService.getSolutionFromCache({
    vendor: route.params.vendor,
    solution: route.params.solution
  })
  const hasInitialData = !!initialData

  const solution = ref(initialData)
  const loading = ref(false)
  const loadingEdges = ref(false)
  const showIntegration = ref(false)
  const showCreateEdgeApp = ref(false)
  const availableApps = ref([])

  onBeforeMount(async () => {
    if (!hasInitialData) {
      loadingStore.startLoading()
    }

    await loadSolution()
    listEdgeApplicationsAvailables()

    loadingStore.finishLoading()
  })

  const loadSolution = async () => {
    try {
      solution.value = await props.loadSolutionService({
        vendor: route.params.vendor,
        solution: route.params.solution
      })
    } catch (error) {
      toast.add({ ...ERROR_PROPS, detail: error })
      loading.value = false
    }
  }

  const openVendorSite = () => {
    props.windowOpen(solution.value.vendor.url, '_blank')
  }

  const openMarketplaceIntegrationsDocumentation = () => {
    props.windowManager.openMarketplaceIntegrationsDocumentation()
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
          label: 'Go to Functions',
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
      toast.add({ ...ERROR_PROPS, detail: error })
      loading.value = false
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
    toast.add({ ...ERROR_PROPS, detail: error })
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
    if (!solution.value?.vendor?.slug) return

    loadingEdges.value = true
    try {
      const payload = {
        vendor: solution.value.vendor.slug,
        solution: solution.value.slug
      }
      availableApps.value = await props.listEdgeApplicationsAvailablesService(payload)
    } catch {
      availableApps.value = []
    } finally {
      loadingEdges.value = false
    }
  }

  const handleLoading = () => {
    loading.value = true
  }

  const isFullyLoaded = computed(() => {
    return solution.value?.overview !== undefined
  })

  const solutionVersion = computed(() => {
    return solution.value?.latestVersion
  })

  const isLastVersion = computed(() => {
    if (!isFullyLoaded.value) return false
    const { isLaunched, isUpdated, newLaunchFlow } = solution.value
    return isLaunched && isUpdated && !newLaunchFlow
  })

  const isOutdated = computed(() => {
    if (!isFullyLoaded.value) return false
    const { isLaunched, isUpdated } = solution.value
    return isLaunched && !isUpdated
  })

  const sidebarTitle = computed(() => {
    if (!isFullyLoaded.value) return ''
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
    if (!isFullyLoaded.value) return ''
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
