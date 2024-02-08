<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import RealTimeEventsHTTPRequestsListView from '@/views/RealTimeEventsHTTPRequests/ListView.vue'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  defineOptions({ name: 'tabs-edge-service' })

  const props = defineProps({
    httpRequests: {
      type: Object,
      required: true
    },
    edgeFunctions: {
      type: Object,
      required: true
    },
    edgeFunctionsConsole: {
      type: Object,
      required: true
    },
    imageProcessor: {
      type: Object,
      required: true
    },
    l2Cache: {
      type: Object,
      required: true
    },
    intelligentDNS: {
      type: Object,
      required: true
    },
    dataStreaming: {
      type: Object,
      required: true
    },
    activityHistory: {
      type: Object,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const defaultTabs = {
    httpRequests: 0,
    edgeFunctions: 1,
    edgeFunctionsConsole: 2,
    imageProcessor: 3,
    l2Cache: 4,
    intelligentDNS: 5,
    dataStreaming: 6,
    activityHistory: 7
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
      tab
    }
    router.push({
      name: 'real-time-events',
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
          <RealTimeEventsHTTPRequestsListView v-bind="props.httpRequests" />
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
