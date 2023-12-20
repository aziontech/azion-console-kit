<script setup>
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import { ref } from 'vue'
  import EdgeApplicationsOriginsListView from '@/views/EdgeApplicationsOrigins/ListView'
  import EdgeApplicationsCacheSettingsListView from '@/views/EdgeApplicationsCacheSettings/ListView'

  defineOptions({ name: 'tabs-edge-service' })

  const props = defineProps({
    edgeApplicationServices: { type: Object, required: true },
    originsServices: { type: Object, required: true },
    cacheSettingsServices: { type: Object, required: true },
    clipboardWrite: { type: Function, required: true }
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
        <TabPanel header="Main Settings"> </TabPanel>
        <TabPanel header="Origins">
          <EdgeApplicationsOriginsListView
            v-if="activeTab === mapTabs.origins"
            :edgeApplicationId="edgeApplicationId"
            v-bind="props.originsServices"
            :clipboardWrite="props.clipboardWrite"
          />
        </TabPanel>

        <TabPanel header="Device Groups"> </TabPanel>
        <TabPanel header="Error Responses"> </TabPanel>
        <TabPanel header="Cache Settings">
          <EdgeApplicationsCacheSettingsListView
            v-if="activeTab === mapTabs.cacheSettings"
            :edgeApplicationId="edgeApplicationId"
            v-bind="props.cacheSettingsServices"
          />
        </TabPanel>
        <TabPanel
          v-if="activatedFunctions"
          header="Functions"
        >
        </TabPanel>
        <TabPanel header="Rules Engine"> </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
