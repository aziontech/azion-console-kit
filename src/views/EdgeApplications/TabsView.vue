<script setup>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import { ref } from 'vue'
  import EdgeApplicationsOriginsListView from '@/views/EdgeApplicationsOrigins/ListView'
  import EdgeApplicationsRulesEngineListView from '@/views/EdgeApplicationsRulesEngine/ListView'
  import EdgeApplicationsDeviceGroupsListView from '@/views/EdgeApplicationsDeviceGroups/ListView.vue'

  defineOptions({ name: 'tabs-edge-service' })

  const props = defineProps({
    edgeApplicationServices: { type: Object, required: true },
    originsServices: { type: Object, required: true },
    clipboardWrite: { type: Function, required: true },
    deviceGroupsServices: { type: Object, required: true },
    rulesEngineServices: { type: Object, required: true }
  })

  const mapTabs = {
    origins: 1,
    deviceGroups: 2,
    errorResponses: 3,
    cacheSettings: 4,
    functions: 5,
    rulesEngine: 6
  }
  const activatedFunctions = false
  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const edgeApplicationId = ref(route.params.id)

  const getTabValue = (tab) => {
    return mapTabs[tab] || 0
  }

  const getTabFromValue = (value) => {
    return Object.keys(mapTabs).find((key) => mapTabs[key] === value)
  }

  const renderTabCurrentRouter = () => {
    const { tab } = route.params
    activeTab.value = getTabValue(tab)
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
        <TabPanel header="Main Settings"> </TabPanel>
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
            :edgeApplicationId="edgeApplicationId"
            v-bind="props.deviceGroupsServices"
          />
        </TabPanel>
        <TabPanel header="Error Responses"> </TabPanel>
        <TabPanel header="Cache Settings"> </TabPanel>
        <TabPanel
          v-if="activatedFunctions"
          header="Functions"
        >
        </TabPanel>
        <TabPanel header="Rules Engine">
          <EdgeApplicationsRulesEngineListView
            :edgeApplicationId="edgeApplicationId"
            v-bind="props.rulesEngineServices"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
