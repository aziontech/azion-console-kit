<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import RealTimeEventsHTTPRequestsListView from '@/views/RealTimeEventsHTTPRequests/ListView.vue'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'tabs-edge-service' })

  defineProps({
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

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)

  const getTabFromValue = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs.value)
    const selectedTab = tabNames.find((tabName) => mapTabs.value[tabName] === selectedTabIndex)
    return selectedTab
  }

  const changeRouteByClickingOnTab = ({ index = 0 }) => {
    const tab = getTabFromValue(index)
    activeTab.value = index
    const params = {
      id: 0,
      tab
    }
    router.push({
      name: '',
      params
    })
  }

  const renderTabCurrentRouter = async () => {
    const { tab = 0 } = route.params
    const activeTabIndexByRoute = mapTabs.value[tab]
    changeRouteByClickingOnTab({ index: activeTabIndexByRoute })
  }

  renderTabCurrentRouter()
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real Time Events" />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full h-full"
      >
        <TabPanel header="HTTP Requests">
          <RealTimeEventsHTTPRequestsListView />
        </TabPanel>
        <TabPanel header="Edge Functions"> </TabPanel>
        <TabPanel header="Edge Functions Console"> </TabPanel>
        <TabPanel header="Image Processor"> </TabPanel>
        <TabPanel header="L2 Cache"> </TabPanel>
        <TabPanel header="Intelligent DNS"> </TabPanel>
        <TabPanel header="Data Streaming"> </TabPanel>
        <TabPanel header="Activity History"> </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
