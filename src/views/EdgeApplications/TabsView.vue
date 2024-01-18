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
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import EditView from './EditView.vue'

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

  const mapTabs = {
    mainSettings: 0,
    origins: 1,
    deviceGroups: 2,
    errorResponses: 3,
    cacheSettings: 4,
    functions: 5,
    rulesEngine: 6
  }

  const toast = useToast()
  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const isLoadBalancer = ref(false)
  const edgeApplicationId = ref(route.params.id)
  const isEnableEdgeFunction = ref(false)
  const responseEdgeApplication = ref(false)
  const title = ref('')

  const showMainSettings = computed(() => {
    return activeTab.value === mapTabs.mainSettings
  })

  const showErrorResponses = computed(() => {
    return activeTab.value === mapTabs.errorResponses
  })

  const showFunctions = computed(() => {
    return activeTab.value === mapTabs.functions
  })

  const showRulesEngine = computed(() => {
    return activeTab.value === mapTabs.rulesEngine
  })

  const showCacheSettings = computed(() => {
    return activeTab.value === mapTabs.cacheSettings
  })

  const showDeviceGroups = computed(() => {
    return activeTab.value === mapTabs.deviceGroups
  })

  const showOrigins = computed(() => {
    return activeTab.value === mapTabs.origins
  })

  const loaderEdgeApplication = async () => {
    try {
      if (responseEdgeApplication.value) return responseEdgeApplication.value

      const response = await props.edgeApplicationServices.loadEdgeApplication({
        id: edgeApplicationId.value
      })
      const { edgeFunctions, loadBalancer, name } = response
      title.value = name
      isLoadBalancer.value = loadBalancer
      isEnableEdgeFunction.value = edgeFunctions
      responseEdgeApplication.value = response
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    }
  }

  const getTabFromValue = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs)
    const selectedTab = tabNames.find((tabName) => mapTabs[tabName] === selectedTabIndex)
    return selectedTab
  }

  const changeRouteByClickingOnTab = (event) => {
    const tab = getTabFromValue(event.index)
    activeTab.value = event.index
    const params = {
      id: edgeApplicationId.value,
      tab
    }
    router.push({
      name: 'edit-edge-application',
      params
    })
  }

  const renderTabCurrentRouter = async () => {
    await loaderEdgeApplication()
    const { tab } = route.params
    const defaultTabIndex = 0
    const activeTabIndexByRoute = mapTabs[tab] || defaultTabIndex
    activeTab.value = activeTabIndexByRoute
  }

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
        v-if="responseEdgeApplication"
      >
        <TabPanel header="Main Settings">
          <EditView
            v-if="showMainSettings"
            :editEdgeApplicationService="edgeApplicationServices.editEdgeApplication"
            :loadEdgeApplicationService="loaderEdgeApplication"
            :updatedRedirect="edgeApplicationServices.updatedRedirect"
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
            v-bind="props.cacheSettingsServices"
          />
        </TabPanel>
        <TabPanel
          header="Functions"
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
            v-bind="props.rulesEngineServices"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
