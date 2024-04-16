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
    mainSettings: 0,
    origins: 1,
    deviceGroups: 2,
    errorResponses: 3,
    cacheSettings: 4,
    functions: 5,
    rulesEngine: 6
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

  const showMainSettings = computed(() => {
    return activeTab.value === mapTabs.value?.mainSettings
  })

  const showErrorResponses = computed(() => {
    return activeTab.value === mapTabs.value?.errorResponses
  })

  const showFunctions = computed(() => {
    return activeTab.value === mapTabs.value?.functions
  })

  const showRulesEngine = computed(() => {
    return activeTab.value === mapTabs.value?.rulesEngine
  })

  const showCacheSettings = computed(() => {
    return activeTab.value === mapTabs.value?.cacheSettings
  })

  const showDeviceGroups = computed(() => {
    return activeTab.value === mapTabs.value?.deviceGroups
  })

  const showOrigins = computed(() => {
    return activeTab.value === mapTabs.value?.origins
  })

  const loaderEdgeApplication = async () => {
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

  const getTabFromValue = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs.value)
    const selectedTab = tabNames.find((tabName) => mapTabs.value[tabName] === selectedTabIndex)
    return selectedTab
  }

  const verifyTab = ({ edgeFunctions }) => {
    if (!edgeFunctions) {
      delete mapTabs.value.functions
      mapTabs.value = Object.entries(mapTabs.value).reduce((acc, [key], index) => {
        acc[key] = index
        return acc
      }, {})
      return
    }
    mapTabs.value = { ...defaultTabs }
  }

  const renderTabCurrentRouter = async () => {
    const { tab = 0 } = route.params
    edgeApplication.value = await loaderEdgeApplication()
    verifyTab(edgeApplication.value)
    const activeTabIndexByRoute = mapTabs.value[tab]
    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
  }

  const title = computed(() => {
    return edgeApplication.value?.name || ''
  })

  const isEnableEdgeFunction = computed(() => {
    return edgeApplication.value?.edgeFunctions
  })

  const isEnableApplicationAccelerator = computed(() => {
    return edgeApplication.value?.applicationAccelerator
  })

  const isLoadBalancer = computed(() => {
    return edgeApplication.value?.loadBalancer
  })

  const isDeliveryProtocolHttps = computed(() => {
    return edgeApplication.value?.deliveryProtocol.includes('https')
  })

  const updatedApplication = (application) => {
    edgeApplication.value = { ...application }
    verifyTab(edgeApplication.value)
  }

  const changeRouteByClickingOnTab = ({ index = 0 }) => {
    changeTab(index)
  }

  const changeTab = (index) => {
    verifyTab(edgeApplication.value)
    const tab = getTabFromValue(index)
    activeTab.value = index
    const params = {
      id: edgeApplicationId.value,
      tab
    }
    router.push({
      name: 'edit-edge-application',
      params
    })
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
    } else {
      tabHasUpdate.oldTab = oldValue
      tabHasUpdate.nextTab = newValue
      tabHasUpdate.updated = generateCurrentTimestamp()
    }
  })

  renderTabCurrentRouter()
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="title" />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
        v-if="edgeApplication"
      >
        <TabPanel header="Main Settings">
          <EditView
            v-if="showMainSettings"
            :editEdgeApplicationService="edgeApplicationServices.editEdgeApplication"
            :edgeApplication="edgeApplication"
            :updatedRedirect="edgeApplicationServices.updatedRedirect"
            :isTab="true"
            @updatedApplication="updatedApplication"
            :contactSalesEdgeApplicationService="
              edgeApplicationServices.contactSalesEdgeApplicationService
            "
          />
        </TabPanel>
        <TabPanel header="Origins">
          <EdgeApplicationsOriginsListView
            v-if="showOrigins"
            :edgeApplicationId="edgeApplicationId"
            :isLoadBalancer="isLoadBalancer"
            v-bind="props.originsServices"
            :clipboardWrite="props.clipboardWrite"
          />
        </TabPanel>
        <TabPanel header="Device Groups">
          <EdgeApplicationsDeviceGroupsListView
            v-if="showDeviceGroups"
            :edgeApplicationId="edgeApplicationId"
            v-bind="props.deviceGroupsServices"
            :clipboardWrite="props.clipboardWrite"
          />
        </TabPanel>
        <TabPanel header="Error Responses">
          <EdgeApplicationsErrorResponseEditView
            v-if="showErrorResponses"
            :edgeApplicationId="edgeApplicationId"
            :listOriginsService="props.originsServices.listOriginsService"
            v-bind="props.errorResponsesServices"
          />
        </TabPanel>
        <TabPanel header="Cache Settings">
          <EdgeApplicationsCacheSettingsListView
            v-if="showCacheSettings"
            :edgeApplicationId="edgeApplicationId"
            :isEnableApplicationAccelerator="isEnableApplicationAccelerator"
            v-bind="props.cacheSettingsServices"
            :showTieredCache="edgeApplication.l2Caching"
          />
        </TabPanel>
        <TabPanel
          header="Functions Instances"
          v-if="isEnableEdgeFunction"
        >
          <EdgeApplicationsFunctionsListView
            v-if="showFunctions"
            v-bind="props.functionsServices"
            :edgeApplicationId="edgeApplicationId"
          />
        </TabPanel>
        <TabPanel header="Rules Engine">
          <EdgeApplicationsRulesEngineListView
            v-if="showRulesEngine"
            :edgeApplicationId="edgeApplicationId"
            :isEnableApplicationAccelerator="isEnableApplicationAccelerator"
            :isDeliveryProtocolHttps="isDeliveryProtocolHttps"
            :hideApplicationAcceleratorInDescription="
              edgeApplication.applicationAccelerator
            "
            v-bind="props.rulesEngineServices"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
