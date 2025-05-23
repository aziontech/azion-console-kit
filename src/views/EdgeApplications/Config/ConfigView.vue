<template>
  <div class="flex flex-col">
    <section class="flex my-10 m-auto h-full">
      <div class="flex flex-col p-8 self-center border surface-border max-w-3xl gap-4">
        <div class="flex flex-col">
          <span class="text-color text-3xl font-medium">Edge Application Created!</span>
          <p class="font-normal text-base text-color-secondary mt-4">
            Start customizing the application with a quick setup. Once completed, advanced settings
            will become available and can be edited anytime on the Edge Application or Workload
            page.
          </p>
        </div>
        <Accordion
          :multiple="true"
          class="mt-4"
          expandIcon="pi pi-chevron-down"
          collapseIcon="pi pi-chevron-up"
          v-model:activeIndex="tabOrigin"
          :pt="{
            root: {
              class: 'flex flex-col gap-8'
            }
          }"
        >
          <AccordionTab
            :disabled="hasCreateEdgeConnector"
            :pt="{
              root: { class: 'rounded-md overflow-hidden border-none' },
              content: { class: 'p-0 pt-6 rounded-b-md overflow-hidden' },
              headerAction: { class: hideOriginBorder },
              headerIcon: { class: `${hasCreateEdgeConnector ? 'hidden' : ''}` }
            }"
          >
            <template #header>
              <div
                class="flex w-full items-center"
                data-testid="create-edge-connector-accordion"
              >
                <div class="w-full flex flex-col gap-2">
                  <span class="text-lg">{{ textInfoEdgeConnector.title }}</span>
                  <span class="text-sm text-color-secondary font-normal"
                    >{{ textInfoEdgeConnector.description }}
                  </span>
                </div>
                <PrimeButton
                  v-if="hasCreateEdgeConnector"
                  icon="pi pi-check"
                ></PrimeButton>
              </div>
            </template>
            <EdgeConnectorApplication
              @createdEdgeConnector="handleResponseEdgeConnector"
              :createEdgeConnectorsService="props.edgeConnectorServices.createEdgeConnectorsService"
            />
          </AccordionTab>
        </Accordion>
        <Accordion
          :multiple="true"
          class="mt-4"
          expandIcon="pi pi-chevron-down"
          collapseIcon="pi pi-chevron-up"
          v-model:activeIndex="tabWorkload"
        >
          <AccordionTab
            :disabled="hasBindWorkload"
            :pt="{
              content: { class: 'p-0 pt-6 rounded-b-md overflow-hidden' },
              header: { class: ' rounded-md' },
              headerAction: { class: hideDomainBorder },
              headerIcon: { class: `${hasBindWorkload ? 'hidden' : ''}` }
            }"
          >
            <template #header>
              <div
                class="flex w-full items-center"
                data-testid="create-domain-accordion"
              >
                <div class="w-full flex flex-col gap-2">
                  <span class="text-lg">{{ textInfoWorkload.title }}</span>
                  <span class="text-sm text-color-secondary font-normal"
                    >{{ textInfoWorkload.description }}
                  </span>
                </div>
                <PrimeButton
                  v-if="hasBindWorkload"
                  icon="pi pi-check"
                ></PrimeButton>
              </div>
            </template>
            <WorkloadEdgeApplication
              :listEdgeFirewallService="props.workloadService.listEdgeFirewallService"
              :loadEdgeFirewallService="props.workloadService.loadEdgeFirewallService"
              :loadDigitalCertificatesService="props.workloadService.loadDigitalCertificateService"
              :loadEdgeApplicationsService="props.workloadService.loadEdgeApplicationsService"
              :listEdgeApplicationsService="props.workloadService.listEdgeApplicationsService"
              :createDomainService="props.workloadService.createDomainService"
              @createdDomain="handleResponse('workloads')"
            />
          </AccordionTab>
        </Accordion>
        <Accordion
          :multiple="true"
          class="mt-4"
          expandIcon="pi pi-chevron-down"
          collapseIcon="pi pi-chevron-up"
          v-model:activeIndex="tabCache"
        >
          <AccordionTab
            :disabled="hasCreateCache"
            :pt="{
              content: { class: 'p-0 pt-6 rounded-b-md overflow-hidden' },
              header: { class: ' rounded-md' },
              headerAction: { class: hideCacheBorder },
              headerIcon: { class: `${hasCreateCache ? 'hidden' : ''}` }
            }"
          >
            <template #header>
              <div
                class="flex w-full items-center"
                data-testid="create-cache-accordion"
              >
                <div class="w-full flex flex-col gap-2">
                  <span class="text-lg">{{ textInfoCache.title }}</span>
                  <span class="text-sm text-color-secondary font-normal"
                    >{{ textInfoCache.description }}
                  </span>
                </div>
                <PrimeButton
                  v-if="hasCreateCache"
                  icon="pi pi-check"
                ></PrimeButton>
              </div>
            </template>
            <CacheEdgeApplication
              @createdCache="handleResponseCache"
              :createCacheSettingsService="props.cacheSettingsServices.createCacheSettingsService"
            />
          </AccordionTab>
        </Accordion>
      </div>
    </section>
    <actionBarSkitConfig
      :loading="loadingFinishedConfig"
      :finishedConfiguration="finishedConfiguration"
      :primaryActionLabel="primaryActionLabel"
      @onSubmit="onSubmit"
    />
  </div>
</template>
<script setup>
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import EdgeConnectorApplication from './EdgeConnectorApplication.vue'
  import WorkloadEdgeApplication from './WorkloadEdgeApplication.vue'
  import CacheEdgeApplication from './CacheEdgeApplication.vue'
  import actionBarSkitConfig from '@/templates/action-bar-block/action-bar-skit-config.vue'
  import PrimeButton from 'primevue/button'
  import { useRoute, useRouter } from 'vue-router'
  import { disabledBackButton } from '@/helpers'

  import { ref, computed, onMounted } from 'vue'

  const props = defineProps({
    workloadService: { type: Object, required: true },
    cacheSettingsServices: { type: Object, required: true },
    edgeConnectorServices: { type: Object, required: true },
    rulesEngineServices: { type: Object, required: true }
  })

  const activeAccordionTab = ref([])
  const hasBindWorkload = ref(false)
  const hasCreateEdgeConnector = ref(false)
  const hasCreateCache = ref(false)
  const route = useRoute()
  const router = useRouter()
  const tabOrigin = ref([])
  const tabWorkload = ref([])
  const tabCache = ref([])
  const edgeConnectorId = ref(0)
  const cacheSettingId = ref(0)
  const edgeApplicationId = ref(route.params.id)
  const rulesEngine = ref(null)
  const loadingFinishedConfig = ref(false)

  const STYLE_HEADER_ACCORDION = 'flex flex-row-reverse p-8 gap-2'
  const STYLE_HEADER_HIDE_BORDER = `${STYLE_HEADER_ACCORDION} border-b-0`

  const hideOriginBorder = computed(() =>
    activeAccordionTab.value.includes(0) ? STYLE_HEADER_HIDE_BORDER : STYLE_HEADER_ACCORDION
  )

  const hideDomainBorder = computed(() =>
    activeAccordionTab.value.includes(1) ? STYLE_HEADER_HIDE_BORDER : STYLE_HEADER_ACCORDION
  )

  const hideCacheBorder = computed(() =>
    activeAccordionTab.value.includes(2) ? STYLE_HEADER_HIDE_BORDER : STYLE_HEADER_ACCORDION
  )

  const textInfoEdgeConnector = computed(() => {
    if (hasCreateEdgeConnector.value) {
      return {
        description:
          'The application will use the Edge Connector servers and hosts as configured. To edit these settings, go to the Edge Connector.',
        title: 'Default Edge Connector defined!'
      }
    }
    return {
      description: 'Customize settings related to Edge Connector servers and hosts.',
      title: 'Define a default Edge Connector'
    }
  })

  const textInfoWorkload = computed(() => {
    if (hasBindWorkload.value) {
      return {
        description:
          'The selected workload is now associated with this application. To edit these settings, go to the Workloads page and select the workload > Deployment.',
        title: 'Workload associed!'
      }
    }
    return {
      description: 'Create the workload to associate with the edge application.',
      title: 'Associate a workload'
    }
  })

  const textInfoCache = computed(() => {
    if (hasCreateCache.value) {
      return {
        description:
          'The edge will handle TTL values sent by the origin and content cache as set. To edit these settings, go to the Edge Application page and select the application > Cache Settings.',
        title: 'Cache expiration policies set!'
      }
    }
    return {
      description:
        'Define how the edge should handle TTL values sent by the origin as well as how long your content should remain cached at the edge.',
      title: 'Set cache expiration policies'
    }
  })

  const finishedConfiguration = computed(
    () => hasBindWorkload.value && hasCreateCache.value && hasCreateEdgeConnector.value
  )
  const primaryActionLabel = computed(() =>
    finishedConfiguration.value ? 'Finish Setup' : 'Skip Configuration'
  )

  const onSubmit = async () => {
    if (hasCreateCache.value && hasCreateEdgeConnector.value) {
      loadingFinishedConfig.value = true
      const payload = {
        ...rulesEngine.value.body[0],
        phase: 'default',
        behaviors: [
          {
            name: 'set_edge_connector',
            edgeConnectorId: edgeConnectorId.value
          },
          {
            name: 'set_cache_policy',
            cacheId: cacheSettingId.value
          }
        ]
      }
      try {
        await props.rulesEngineServices.editRulesEngineService({
          id: edgeApplicationId.value,
          payload
        })
      } finally {
        loadingFinishedConfig.value = false
      }
    }
    router.push({ name: 'edit-edge-application', params: { id: edgeApplicationId.value } })
  }

  const closeAccordionTab = (tab) => {
    tab.value = tab.value.filter((item) => item !== 0)
  }

  const handleResponseEdgeConnector = (value) => {
    edgeConnectorId.value = value.id
    handleResponse('edgeConnector')
  }

  const handleResponseCache = (value) => {
    cacheSettingId.value = value.cacheId
    handleResponse('cache')
  }

  const handleResponse = (tab) => {
    if (tab === 'edgeConnector') {
      hasCreateEdgeConnector.value = true
      closeAccordionTab(tabOrigin)
    }
    if (tab === 'cache') {
      hasCreateCache.value = true
      closeAccordionTab(tabCache)
    }
    if (tab === 'workloads') {
      hasBindWorkload.value = true
      closeAccordionTab(tabWorkload)
    }
  }

  onMounted(async () => {
    disabledBackButton()
    rulesEngine.value = await props.rulesEngineServices.listRulesEngineService({
      id: edgeApplicationId.value
    })
  })
</script>
