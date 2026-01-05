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
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import EditView from './EditView.vue'
  import EditViewV3 from './V3/EditView.vue'
  import { INFORMATION_TEXTS } from '@/helpers'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'
  import MigrationMessage from './components/MigrationMessage.vue'
  import PrimeButton from 'primevue/button'
  import EditViewSkeleton from './components/EditViewSkeleton.vue'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeApplicationFunctionService } from '@/services/v2/edge-app/edge-application-functions-service'
  import { deviceGroupService } from '@/services/v2/edge-app/edge-app-device-group-service'
  import { edgeAppErrorResponseService } from '@/services/v2/edge-app/edge-app-error-response-service'
  import { cacheSettingsService } from '@/services/v2/edge-app/edge-app-cache-settings-service'
  import { rulesEngineService } from '@/services/v2/edge-app/edge-app-rules-engine-service'
  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'tabs-edge-service' })

  const props = defineProps({
    edgeApplicationServices: { type: Object, required: true },
    originsServices: { type: Object, required: true },
    clipboardWrite: { type: Function, required: true },
    deviceGroupsServices: { type: Object, required: true },
    rulesEngineServices: { type: Object, required: true },
    functionsServices: { type: Object, required: true },
    edgeFunctionsServices: { type: Object, required: true }
  })

  const defaultTabs = ref({
    'main-settings': 0,
    origins: !hasFlagBlockApiV4() ? null : 1,
    'device-groups': !hasFlagBlockApiV4() ? 1 : 2,
    'error-responses': !hasFlagBlockApiV4() ? null : 3,
    'cache-settings': !hasFlagBlockApiV4() ? 2 : 4,
    functions: !hasFlagBlockApiV4() ? 3 : 5,
    'rules-engine': !hasFlagBlockApiV4() ? 4 : 6
  })
  const mapTabs = ref({ ...defaultTabs.value })

  const toast = useToast()
  const route = useRoute()
  const router = useRouter()
  const breadcrumbs = useBreadcrumbs()
  const activeTab = ref(0)
  const edgeApplicationId = ref(route.params.id)
  const edgeApplication = ref()
  const isLocked = ref(false)

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)

  const componentsRefs = ref(null)

  const addButtonController = computed(() => {
    const tab = filteredTabs.value[activeTab.value]
    return {
      showAddButtonTab: !!tab?.showAddButtonTab,
      label: tab?.header || 'Create',
      click: () => componentsRefs.value[0].openCreateDrawer?.()
    }
  })

  const handleTrackClickToEditErrorResponses = () => {
    tracker.product.clickToEdit({ productName: 'Error Responses' }).track()
  }

  const checkIsLocked = async () => {
    if (hasFlagBlockApiV4()) {
      const edgeApplication = await edgeAppService.loadEdgeApplicationService({
        id: edgeApplicationId.value,
        params: { fields: 'product_version' }
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
      toast.add({ closable: true, severity: 'error', summary: error })
      router.push({ name: props.edgeApplicationServices.updatedRedirect })
    }
  }

  const reindexMapTabs = () => {
    mapTabs.value = Object.entries(mapTabs.value).reduce((acc, [key], index) => {
      if (!hasFlagBlockApiV4() && (key === 'origins' || key === 'error-responses')) {
        return acc
      }
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
    mapTabs.value = { ...defaultTabs.value }
  }

  const preloadTabData = async () => {
    if (!edgeApplication.value) return

    const preloadPromises = []
    const edgeFunctionsProperty = hasFlagBlockApiV4() ? 'edgeFunctions' : 'edgeFunctionsEnabled'

    if (hasFlagBlockApiV4()) {
      preloadPromises.push(props.originsServices.prefetchOriginsList(edgeApplicationId.value))

      preloadPromises.push(
        edgeAppErrorResponseService.prefetchEdgeApplicationsErrorResponseList(
          edgeApplicationId.value
        )
      )
    }

    preloadPromises.push(deviceGroupService.prefetchDeviceGroupsList(edgeApplicationId.value))

    preloadPromises.push(cacheSettingsService.prefetchCacheSettingsList(edgeApplicationId.value))

    if (edgeApplication.value[edgeFunctionsProperty]) {
      preloadPromises.push(
        edgeApplicationFunctionService.prefetchFunctionsList(edgeApplicationId.value)
      )
    }

    preloadPromises.push(rulesEngineService.prefetchRulesEngineList(edgeApplicationId.value))

    await Promise.allSettled(preloadPromises)
  }

  const renderTabByCurrentRouter = async () => {
    const { tab } = route.params

    let selectedTab = tab
    if (!tab) selectedTab = 'main-settings'

    edgeApplication.value = await handleLoadEdgeApplication()
    verifyTab(edgeApplication.value)

    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, edgeApplication.value?.name)
    preloadTabData()

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
    const params = { id: edgeApplicationId.value, tab }
    router.push({ name: 'edit-application', params, query: route.query })
  }
  const changeTab = (index) => {
    verifyTab(edgeApplication.value)
    const tab = getTabFromIndex(index)
    activeTab.value = index
    changeRouteByTab(tab)

    if (tab === 'error-responses') handleTrackClickToEditErrorResponses()
  }

  const visibleOnSaved = ref(false)

  provide('unsaved', { changeTab, tabHasUpdate, formHasUpdated, visibleOnSaved })

  provide('edgeApplication', edgeApplication)

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
      condition: hasFlagBlockApiV4(),
      show: showTabs.origins,
      showAddButtonTab: true,
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
      showAddButtonTab: true,
      props: () => ({
        ...props.deviceGroupsServices,
        edgeApplicationId: edgeApplicationId.value,
        clipboardWrite: props.clipboardWrite
      })
    },
    {
      header: 'Error Responses',
      component: EdgeApplicationsErrorResponseEditView,
      condition: hasFlagBlockApiV4(),
      show: showTabs.errorResponses,
      props: () => ({
        edgeApplicationId: edgeApplicationId.value,
        listOriginsService: props.originsServices.listOriginsService
      })
    },
    {
      header: 'Cache Settings',
      component: EdgeApplicationsCacheSettingsListView,
      condition: true,
      show: showTabs.cacheSettings,
      showAddButtonTab: true,
      props: () => ({
        isApplicationAcceleratorEnabled: isModuleEnabled(applicationAcceleratorEnabled.value).value,
        isTieredCacheEnabled: true,
        edgeApplicationId: edgeApplicationId.value
      })
    },
    {
      header: 'Functions Instances',
      component: EdgeApplicationsFunctionsListView,
      condition: isModuleEnabled(edgeFunctionsEnabled.value),
      show: showTabs.functions,
      showAddButtonTab: true,
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
          edgeApplication.value[applicationAcceleratorEnabled.value],
        navigateToApplicationAccelerator: navigateToApplicationAccelerator
      })
    }
  ])

  const filteredTabs = computed(() => {
    return tabs.value.filter((tab) => tab.condition)
  })

  renderTabByCurrentRouter()

  const navigateToApplicationAccelerator = () => {
    changeTab(mapTabs.value['main-settings'])
    setTimeout(() => {
      const element = document.querySelector('label[for="applicationAccelerator-switch-0"]')
      if (element) {
        const headerHeight = document.querySelector('header')?.offsetHeight || 0
        const additionalOffset = 100
        const totalOffset = headerHeight + additionalOffset

        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - totalOffset

        window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
      }
    }, 50)
  }

  onMounted(() => {
    checkIsLocked()
  })
</script>

<template>
  <EditViewSkeleton v-if="!edgeApplication" />

  <ContentBlock
    v-else
    data-testid="edge-application-details-content-block"
  >
    <template #heading>
      <MigrationMessage />

      <PageHeadingBlock
        :pageTitle="tabTitle"
        :tag="tagLocked"
        :entityName="edgeApplication?.name"
        data-testid="edge-application-details-heading"
      />
    </template>
    <template #content>
      <div
        class="h-full w-full"
        v-if="edgeApplication"
      >
        <div class="flex align-center justify-between relative">
          <TabView
            :activeIndex="activeTab"
            @tab-click="({ index = 0 }) => changeTab(index)"
            class="flex-1"
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
            </TabPanel>
          </TabView>
          <div
            v-if="addButtonController.showAddButtonTab"
            class="flex ml-4 items-center"
          >
            <PrimeButton
              :label="addButtonController.label"
              size="small"
              icon="pi pi-plus"
              @click="addButtonController.click"
              data-testid="data-table-actions-column-body-actions-menu-button"
            />
          </div>
        </div>

        <div>
          <InlineMessage
            class="mt-4 w-full"
            severity="warn"
            v-if="isLocked"
          >
            <b>Warning</b>
            {{ INFORMATION_TEXTS.LOCKED_MESSAGE }}
          </InlineMessage>
          <template
            v-for="(tab, index) in filteredTabs"
            :key="index"
          >
            <component
              ref="componentsRefs"
              :is="tab.component"
              v-if="tab.show"
              @updatedApplication="updatedApplication"
              v-bind="tab.props()"
            />
          </template>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>
