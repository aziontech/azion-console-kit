<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Events" />
    </template>
    <template #content>
      <TabView
        :activeIndex="tabSelectIndex"
        class="w-full h-full"
        @tab-click="changePage"
      >
        <TabPanel :header="mapTabs.httpRequests.label">
          <RealTimeEventsHTTPRequestsListView v-bind="props.httpRequests" />
        </TabPanel>
        <TabPanel :header="mapTabs.EdgeFunctions.label">
          <RealTimeEventEdgeFunctionsListView
            v-bind="props.edgeFunctions"
          ></RealTimeEventEdgeFunctionsListView>
        </TabPanel>
        <TabPanel :header="mapTabs.EdgeFunctionsConsole.label">
          <RealTimeEventEdgeFunctionsConsoleListView
            v-bind="props.edgeFunctionsConsole"
          ></RealTimeEventEdgeFunctionsConsoleListView>
        </TabPanel>
        <TabPanel :header="mapTabs.ImageProcessor.label"> </TabPanel>
        <TabPanel :header="mapTabs.L2Cache.label"> </TabPanel>
        <TabPanel :header="mapTabs.IntelligentDNS.label"> </TabPanel>
        <TabPanel :header="mapTabs.DataStreaming.label"> </TabPanel>
        <TabPanel :header="mapTabs.ActivityHistory.label"> </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import RealTimeEventsHTTPRequestsListView from '@/views/RealTimeEventsHTTPRequests/ListView'
  import RealTimeEventEdgeFunctionsListView from '@/views/RealTimeEventsEdgeFunctions/ListView'
  import RealTimeEventEdgeFunctionsConsoleListView from '@/views/RealTimeEventsEdgeFunctionsConsole/ListView'

  defineOptions({ name: 'RealTimeEventsTabsView' })

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
    }
  })

  const route = useRoute()
  const router = useRouter()
  const tabSelectIndex = ref(0)

  const mapTabs = ref({
    httpRequests: {
      index: 0,
      tabName: 'http-requests',
      label: 'HTTP Requests'
    },
    EdgeFunctions: {
      index: 1,
      tabName: 'edge-functions',
      label: 'Edge Functions'
    },
    EdgeFunctionsConsole: {
      index: 2,
      tabName: 'edge-functions-console',
      label: 'Edge Functions Console'
    },
    ImageProcessor: {
      index: 3,
      tabName: 'image-processor',
      label: 'Image Processor'
    },
    L2Cache: {
      index: 4,
      tabName: 'l2-cache',
      label: 'L2 Cache'
    },
    IntelligentDNS: {
      index: 5,
      tabName: 'intelligent-dns',
      label: 'Intelligent DNS'
    },
    DataStreaming: {
      index: 6,
      tabName: 'data-streaming',
      label: 'Data Streaming'
    },
    ActivityHistory: {
      index: 7,
      tabName: 'activity-history',
      label: 'Activity History'
    }
  })

  const changePage = async ({ index }) => {
    const tab = Object.values(mapTabs.value).find((tab) => tab.index === index)
    selectedTab(tab)
  }

  const updateRouter = (tabName) => {
    const { name, query, params } = route
    router.push({
      name,
      params: {
        ...params,
        tab: tabName
      },
      query
    })
  }

  const selectedTab = (tabSelectValue) => {
    tabSelectIndex.value = tabSelectValue.index
    updateRouter(tabSelectValue.tabName)
  }

  const tabSelectInitial = () => {
    const { params } = route

    if (params.tab) {
      const tabSelect = Object.values(mapTabs.value).find((tab) => tab.tabName === params.tab)
      selectedTab(tabSelect)
      return
    }

    selectedTab(Object.values(mapTabs.value)[0])
  }

  onMounted(() => {
    tabSelectInitial()
  })
</script>
