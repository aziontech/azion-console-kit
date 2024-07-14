<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import EdgeApplicationsCacheSettingsListView from '@/views/EdgeApplicationsCacheSettings/ListView'
  import EdgeApplicationsDeviceGroupsListView from '@/views/EdgeApplicationsDeviceGroups/ListView.vue'
  import EdgeApplicationsErrorResponseEditView from '@/views/EdgeApplicationsErrorResponses/EditView'
  import EdgeApplicationsFunctionsListView from '@/views/EdgeApplicationsFunctions/ListView'
  import EdgeApplicationsOriginsListView from '@/views/EdgeApplicationsOrigins/ListView'
  import EdgeApplicationsRulesEngineListView from '@/views/EdgeApplicationsRulesEngine/ListView'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from 'primevue/usetoast'
  import { computed, ref, reactive, provide, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import EditView from './EditView.vue'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'

  defineOptions({ name: 'tabs-edge-service' })

  const props = defineProps({
    edgeApplicationServices: { type: Object, required: true },
    originsServices: { type: Object, required: true },
    cacheSettingsServices: { type: Object, required: true },
    clipboardWrite: { type: Function, required: true },
    deviceGroupsServices: { type: Object, required: true },
    errorResponsesServices: { type: Object, required: true },
    rulesEngineServices: { type: Object, required: true },
    functionsServices: { type: Object, required: true }
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

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)

  const handleLoadEdgeApplication = async () => {
    try {
      return await props.edgeApplicationServices.loadEdgeApplication({
        id: edgeApplicationId.value
      })
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
  const verifyTab = ({ edgeFunctions }) => {
    if (!edgeFunctions) {
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

  const isHttpsEnabled = () =>
    computed(() => edgeApplication.value?.deliveryProtocol.includes('https'))
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
  }

  const visibleOnSaved = ref(false)

  provide('unsaved', {
    changeTab,
    tabHasUpdate,
    formHasUpdated,
    visibleOnSaved
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
      component: EditView,
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
        isLoadBalancerEnabled: isModuleEnabled('loadBalancer').value,
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
        ...props.cacheSettingsServices,
        isApplicationAcceleratorEnabled: isModuleEnabled('applicationAccelerator').value,
        isTieredCacheEnabled: isModuleEnabled('l2Caching').value,
        edgeApplicationId: edgeApplicationId.value
      })
    },
    {
      header: 'Functions Instances',
      component: EdgeApplicationsFunctionsListView,
      condition: isModuleEnabled('edgeFunctions'),
      show: showTabs.functions,
      props: () => ({
        ...props.functionsServices,
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
        isImageOptimizationEnabled: isModuleEnabled('imageOptimization').value,
        isDeliveryProtocolHttps: isHttpsEnabled().value,
        isApplicationAcceleratorEnabled: isModuleEnabled('applicationAccelerator').value,
        isEdgeFunctionEnabled: isModuleEnabled('edgeFunctions').value,
        edgeApplicationId: edgeApplicationId.value,
        hideApplicationAcceleratorInDescription: edgeApplication.value.applicationAccelerator
      })
    }
  ])

  const filteredTabs = computed(() => {
    return tabs.value.filter((tab) => tab.condition)
  })

  renderTabByCurrentRouter()
</script>

<template>
  <ContentBlock data-testid="edge-application-details-content-block">
    <template #heading>
      <PageHeadingBlock
        :pageTitle="tabTitle"
        data-testid="edge-application-details-heading"
      />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="({ index = 0 }) => changeTab(index)"
        class="w-full h-full"
        v-if="edgeApplication"
        data-testid="edge-application-details-tab-view"
      >
        <TabPanel
          v-for="(tab, index) in filteredTabs"
          :pt="{
            headerAction: {
              id: `tab_${index}`
            }
          }"
          :key="index"
          :header="tab.header"
          :id="tab.header"
          data-testid="edge-application-details-tab-panel"
        >
          <component
            :is="tab.component"
            v-if="tab.show"
            @updatedApplication="updatedApplication"
            v-bind="tab.props()"
            data-testid="edge-application-details-tab-panel-component"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
