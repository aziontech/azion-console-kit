<script setup>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import { ref } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import EdgeApplicationsOriginsListView from '@/views/EdgeApplicationsOrigins/ListView'
  import EdgeApplicationsRulesEngineListView from '@/views/EdgeApplicationsRulesEngine/ListView'
  import EdgeApplicationsCacheSettingsListView from '@/views/EdgeApplicationsCacheSettings/ListView'
  import EdgeApplicationsFunctionsListView from '@/views/EdgeApplicationsFunctions/ListView'
  import EdgeApplicationsDeviceGroupsListView from '@/views/EdgeApplicationsDeviceGroups/ListView.vue'
  import EditView from './EditView.vue'

  defineOptions({ name: 'tabs-edge-service' })

  const props = defineProps({
    edgeApplicationServices: { type: Object, required: true },
    originsServices: { type: Object, required: true },
    cacheSettingsServices: { type: Object, required: true },
    clipboardWrite: { type: Function, required: true },
    deviceGroupsServices: { type: Object, required: true },
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
  const edgeApplicationId = ref(route.params.id)
  const isEnableEdgeFunction = ref(false)
  const isEnableApplicationAcceleration = ref(false)

  const loaderEdgeApplication = async () => {
    try {
      const { edgeFunctions, applicationAcceleration } = await props.edgeApplicationServices.loadEdgeApplication({
        id: edgeApplicationId.value
      })
      isEnableEdgeFunction.value = edgeFunctions
      isEnableApplicationAcceleration.value = applicationAcceleration
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    }
  }

  loaderEdgeApplication()

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

  const renderTabCurrentRouter = () => {
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
      <PageHeadingBlock pageTitle="Edit Edge Application" />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel header="Main Settings">
          <div class="mt-8">
            <EditView
              :editEdgeApplicationService="edgeApplicationServices.editEdgeApplication"
              :loadEdgeApplicationService="edgeApplicationServices.loadEdgeApplication"
              :updatedRedirect="edgeApplicationServices.updatedRedirect"
              :contactSalesEdgeApplicationService="
                edgeApplicationServices.contactSalesEdgeApplicationService
              "
              :showActionBar="activeTab === mapTabs.mainSettings"
            />
          </div>
        </TabPanel>
        <TabPanel header="Origins">
          <EdgeApplicationsOriginsListView
            v-if="activeTab === mapTabs.origins"
            :edgeApplicationId="edgeApplicationId"
            v-bind="props.originsServices"
            :clipboardWrite="props.clipboardWrite"
          />
        </TabPanel>

        <TabPanel header="Device Groups">
          <EdgeApplicationsDeviceGroupsListView
            v-if="activeTab === mapTabs.deviceGroups"
            :edgeApplicationId="edgeApplicationId"
            v-bind="props.deviceGroupsServices"
            :clipboardWrite="props.clipboardWrite"
          />
        </TabPanel>
        <TabPanel header="Error Responses"> </TabPanel>
        <TabPanel header="Cache Settings">
          <EdgeApplicationsCacheSettingsListView
            v-if="activeTab === mapTabs.cacheSettings"
            :edgeApplicationId="edgeApplicationId"
            v-bind="props.cacheSettingsServices"
          />
        </TabPanel>
        <TabPanel
          header="Functions"
          v-if="isEnableEdgeFunction"
        >
          <EdgeApplicationsFunctionsListView
            v-if="activeTab === mapTabs.functions"
            v-bind="props.functionsServices"
            :edgeApplicationId="edgeApplicationId"
          />
        </TabPanel>
        <TabPanel header="Rules Engine">
          <EdgeApplicationsRulesEngineListView
            v-if="activeTab === mapTabs.rulesEngine"
            :edgeApplicationId="edgeApplicationId"
            :isEnableApplicationAcceleration="isEnableApplicationAcceleration"
            v-bind="props.rulesEngineServices"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
