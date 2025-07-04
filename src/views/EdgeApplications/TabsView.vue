<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EdgeApplicationsCacheSettingsListView from '@/views/EdgeApplicationsCacheSettings/ListView'
  import EdgeApplicationsDeviceGroupsListView from '@/views/EdgeApplicationsDeviceGroups/ListView.vue'
  import EdgeApplicationsErrorResponseEditView from '@/views/EdgeApplicationsErrorResponses/EditView'
  import EdgeApplicationsFunctionsListView from '@/views/EdgeApplicationsFunctions/ListView'
  import EdgeApplicationsOriginsListView from '@/views/EdgeApplicationsOrigins/ListView'
  import EdgeApplicationsRulesEngineListView from '@/views/EdgeApplicationsRulesEngine/ListView'
  import InlineMessage from 'primevue/inlinemessage'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from 'primevue/usetoast'
  import { computed, ref, reactive, provide, watch, inject, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import EditView from './EditView.vue'
  import EditViewV3 from './V3/EditView.vue'
  import { INFORMATION_TEXTS } from '@/helpers'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'
  import MigrationMessage from './components/MigrationMessage.vue'

  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import { edgeAppService } from '@/services/v2'
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'tabs-edge-service' })

  const props = defineProps({
    edgeApplicationServices: { type: Object, required: true },
    originsServices: { type: Object, required: true },
    clipboardWrite: { type: Function, required: true },
    deviceGroupsServices: { type: Object, required: true },
    errorResponsesServices: { type: Object, required: true },
    rulesEngineServices: { type: Object, required: true },
    functionsServices: { type: Object, required: true },
    edgeFunctionsServices: { type: Object, required: true }
  })

  const defaultTabs = {
    'main-settings': 0,
    origins: 1,
    'device-groups': 2,
    'error-responses': 3,
    'cache-settings': 4,
    functions: 5,
    'rules-engine': 6
  }

  const mapTabs = ref({ ...defaultTabs })

  const toast = useToast()
  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const edgeApplicationId = ref(route.params.id)
  const edgeApplication = ref()
  const isLocked = ref(false)

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)

  const handleTrackClickToEditErrorResponses = () => {
    tracker.product
      .clickToEdit({
        productName: 'Error Responses'
      })
      .track()
  }

  const checkIsLocked = async () => {
    if (hasFlagBlockApiV4()) {
      const edgeApplication = await edgeAppService.loadEdgeApplicationService({
        id: edgeApplicationId.value,
        params: {
          fields: 'product_version'
        }
      })

      isLocked.value = edgeApplication.productVersion === 'custom'
    }
  }

  const handleLoadEdgeApplication = async () => {
    try {
      const params = { id: edgeApplicationId.value }

      if (hasFlagBlockApiV4()) {
        return await props.edgeApplicationServices.loadEdgeApplication(params)
      }

      return await edgeAppService.loadEdgeApplicationService(params)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
      router.push({ name: props.edgeApplicationServices.updatedRedirect })
    }
  }

  const reindexMapTabs = () => {
    mapTabs.value = Object.entries(mapTabs.value).reduce((acc, [key], index) => {
      acc[key] = index
      return acc
    }, {})
  }
  const verifyTab = (edgeApplication) => {
    if (!edgeApplication[edgeFunctionsEnabled.value]) {
      delete mapTabs.value.functions
      reindexMapTabs()
      return
    }
    mapTabs.value = { ...defaultTabs }
  }

  const renderTabByCurrentRouter = async () => {
    const { tab } = route.params

    let selectedTab = tab
    if (!tab) selectedTab = 'main-settings'

    edgeApplication.value = await handleLoadEdgeApplication()
    verifyTab(edgeApplication.value)

    const activeTabIndexByRoute = mapTabs.value[selectedTab]
    changeTab(activeTabIndexByRoute)
  }

  const tabTitle = computed(() => edgeApplication.value?.name || '')

  const isModuleEnabled = (propertyName) => computed(() => edgeApplication.value?.[propertyName])

  const showTab = (tabName) => computed(() => activeTab.value === mapTabs.value?.[tabName])
  const showTabs = {
    mainSettings: showTab('main-settings'),
    errorResponses: showTab('error-responses'),
    functions: showTab('functions'),
    rulesEngine: showTab('rules-engine'),
    cacheSettings: showTab('cache-settings'),
    deviceGroups: showTab('device-groups'),
    origins: showTab('origins')
  }

  const updatedApplication = (application) => {
    edgeApplication.value = { ...application }
    verifyTab(edgeApplication.value)
  }

  const getTabFromIndex = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs.value)
    const selectedTab = tabNames.find((tabName) => mapTabs.value[tabName] === selectedTabIndex)
    return selectedTab
  }
  const changeRouteByTab = (tab) => {
    const params = {
      id: edgeApplicationId.value,
      tab
    }
    router.push({
      name: 'edit-edge-application',
      params
    })
  }
  const changeTab = (index) => {
    verifyTab(edgeApplication.value)
    const tab = getTabFromIndex(index)
    activeTab.value = index
    changeRouteByTab(tab)

    if (tab === 'error-responses') handleTrackClickToEditErrorResponses()
  }

  const visibleOnSaved = ref(false)

  provide('unsaved', {
    changeTab,
    tabHasUpdate,
    formHasUpdated,
    visibleOnSaved
  })

  const tagProps = {
    value: 'Locked',
    severity: 'warning',
    tooltip: INFORMATION_TEXTS.LOCKED_MESSAGE_TOOLTIP
  }

  const tagLocked = computed(() => {
    if (isLocked.value) {
      return tagProps
    }
    return null
  })

  const edgeFunctionsEnabled = computed(() => {
    return hasFlagBlockApiV4() ? 'edgeFunctions' : 'edgeFunctionsEnabled'
  })

  const applicationAcceleratorEnabled = computed(() => {
    return hasFlagBlockApiV4() ? 'applicationAccelerator' : 'applicationAcceleratorEnabled'
  })

  const tieredCacheEnabled = computed(() => {
    return hasFlagBlockApiV4() ? 'l2Caching' : 'tieredCacheEnabled'
  })

  const imageProcessorEnabled = computed(() => {
    return hasFlagBlockApiV4() ? 'imageOptimization' : 'imageProcessorEnabled'
  })

  watch(activeTab, (newValue, oldValue) => {
    if (visibleOnSaved.value) {
      return
    }

    tabHasUpdate.oldTab = oldValue
    tabHasUpdate.nextTab = newValue
    tabHasUpdate.updated = generateCurrentTimestamp()
  })

  const tabs = ref([
    {
      header: 'Main Settings',
      component: hasFlagBlockApiV4() ? EditViewV3 : EditView,
      condition: true,
      show: showTabs.mainSettings,
      props: () => ({
        editEdgeApplicationService: props.edgeApplicationServices.editEdgeApplication,
        edgeApplication: edgeApplication.value,
        updatedRedirect: props.edgeApplicationServices.updatedRedirect,
        isTab: true,
        contactSalesEdgeApplicationService:
          props.edgeApplicationServices.contactSalesEdgeApplicationService
      })
    },
    {
      header: 'Origins',
      component: EdgeApplicationsOriginsListView,
      condition: true,
      show: showTabs.origins,
      props: () => ({
        ...props.originsServices,
        edgeApplicationId: edgeApplicationId.value,
        clipboardWrite: props.clipboardWrite
      })
    },
    {
      header: 'Device Groups',
      component: EdgeApplicationsDeviceGroupsListView,
      condition: true,
      show: showTabs.deviceGroups,
      props: () => ({
        ...props.deviceGroupsServices,
        edgeApplicationId: edgeApplicationId.value,
        clipboardWrite: props.clipboardWrite
      })
    },
    {
      header: 'Error Responses',
      component: EdgeApplicationsErrorResponseEditView,
      condition: true,
      show: showTabs.errorResponses,
      props: () => ({
        ...props.errorResponsesServices,
        edgeApplicationId: edgeApplicationId.value,
        listOriginsService: props.originsServices.listOriginsService
      })
    },
    {
      header: 'Cache Settings',
      component: EdgeApplicationsCacheSettingsListView,
      condition: true,
      show: showTabs.cacheSettings,
      props: () => ({
        isApplicationAcceleratorEnabled: isModuleEnabled(applicationAcceleratorEnabled.value).value,
        isTieredCacheEnabled: isModuleEnabled(tieredCacheEnabled.value).value,
        edgeApplicationId: edgeApplicationId.value
      })
    },
    {
      header: 'Functions Instances',
      component: EdgeApplicationsFunctionsListView,
      condition: isModuleEnabled(edgeFunctionsEnabled.value),
      show: showTabs.functions,
      props: () => ({
        ...props.functionsServices,
        ...props.edgeFunctionsServices,
        edgeApplicationId: edgeApplicationId.value
      })
    },
    {
      header: 'Rules Engine',
      component: EdgeApplicationsRulesEngineListView,
      condition: true,
      show: showTabs.rulesEngine,
      props: () => ({
        ...props.rulesEngineServices,
        isImageOptimizationEnabled: isModuleEnabled(imageProcessorEnabled.value).value,
        isApplicationAcceleratorEnabled: isModuleEnabled(applicationAcceleratorEnabled.value).value,
        isEdgeFunctionEnabled: isModuleEnabled(edgeFunctionsEnabled.value).value,
        edgeApplicationId: edgeApplicationId.value,
        clipboardWrite: props.clipboardWrite,
        hideApplicationAcceleratorInDescription:
          edgeApplication.value[applicationAcceleratorEnabled.value]
      })
    }
  ])

  const filteredTabs = computed(() => {
    return tabs.value.filter((tab) => tab.condition)
  })

  renderTabByCurrentRouter()

  onMounted(() => {
    checkIsLocked()
  })
</script>

<template>
  <ContentBlock data-testid="edge-application-details-content-block">
    <template #heading>
      <MigrationMessage />

      <PageHeadingBlock
        :pageTitle="tabTitle"
        :tag="tagLocked"
        data-testid="edge-application-details-heading"
      />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="({ index = 0 }) => changeTab(index)"
        class="w-full h-full"
        v-if="edgeApplication"
      >
        <TabPanel
          v-for="(tab, index) in filteredTabs"
          :pt="{
            headerAction: {
              id: `tab_${index}`
            },
            root: {
              'data-testid': `edge-application-details-tab-panel__${tab.header}__tab`,
              id: `${tab.header}`
            }
          }"
          :key="index"
          :header="tab.header"
        >
          <InlineMessage
            class="mt-4 w-full"
            severity="warn"
            v-if="isLocked"
          >
            <b>Warning</b>
            {{ INFORMATION_TEXTS.LOCKED_MESSAGE }}
          </InlineMessage>
          <component
            :is="tab.component"
            v-if="tab.show"
            @updatedApplication="updatedApplication"
            v-bind="tab.props()"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
