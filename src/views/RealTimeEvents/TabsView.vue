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
          <RealTimeEventsHTTPRequestsListView
            v-bind="props.httpRequests"
            v-model:dateTime="timeFilter"
            v-if="mapTabs.httpRequests.index === tabSelectIndex"
          />
        </TabPanel>
        <TabPanel :header="mapTabs.EdgeFunctions.label">
          <RealTimeEventEdgeFunctionsListView
            v-bind="props.edgeFunctions"
            v-model:dateTime="timeFilter"
            v-if="mapTabs.EdgeFunctions.index === tabSelectIndex"
          />
        </TabPanel>
        <TabPanel :header="mapTabs.EdgeFunctionsConsole.label">
          <RealTimeEventEdgeFunctionsConsoleListView
            v-bind="props.edgeFunctionsConsole"
            v-model:dateTime="timeFilter"
            v-if="mapTabs.EdgeFunctionsConsole.index === tabSelectIndex"
          />
        </TabPanel>
        <TabPanel :header="mapTabs.ImageProcessor.label">
          <RealTimeEventsImageProcessor
            v-bind="props.imageProcessor"
            v-model:dateTime="timeFilter"
            v-if="mapTabs.ImageProcessor.index === tabSelectIndex"
          />
        </TabPanel>
        <TabPanel :header="mapTabs.L2Cache.label">
          <RealTimeEventsL2Cache
            v-bind="props.l2Cache"
            v-model:dateTime="timeFilter"
            v-if="mapTabs.L2Cache.index === tabSelectIndex"
          />
        </TabPanel>
        <TabPanel :header="mapTabs.IntelligentDNS.label">
          <RealTimeEventsIntelligentDNSListView
            v-bind="props.intelligentDNS"
            v-model:dateTime="timeFilter"
            v-if="mapTabs.IntelligentDNS.index === tabSelectIndex"
          />
        </TabPanel>
        <TabPanel :header="mapTabs.DataStream.label">
          <RealTimeEventsDataStreamListView
            v-bind="props.dataStream"
            v-model:dateTime="timeFilter"
            v-if="mapTabs.DataStream.index === tabSelectIndex"
          />
        </TabPanel>
        <TabPanel :header="mapTabs.ActivityHistory.label">
          <RealTimeEventsActivityHistoryListView
            v-bind="props.activityHistory"
            v-model:dateTime="timeFilter"
            v-if="mapTabs.ActivityHistory.index === tabSelectIndex"
          />
        </TabPanel>
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
  import RealTimeEventsDataStreamListView from '@/views/RealTimeEventsDataStream/ListView'
  import RealTimeEventsActivityHistoryListView from '@/views/RealTimeEventsActivityHistory/ListView'
  import RealTimeEventsIntelligentDNSListView from '@/views/RealTimeEventsIntelligentDNS/ListView'
  import RealTimeEventsImageProcessor from '@/views/RealTimeEventsImageProcessor/ListView'
  import RealTimeEventsL2Cache from '@/views/RealTimeEventsL2Cache/ListView'
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
    },
    activityHistory: {
      type: Object,
      required: true
    },
    dataStream: {
      type: Object,
      required: true
    },
    intelligentDNS: {
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
    }
  })

  const route = useRoute()
  const router = useRouter()
  const tabSelectIndex = ref(0)
  const timeFilter = ref({})

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
      label: 'Tiered Cache'
    },
    IntelligentDNS: {
      index: 5,
      tabName: 'intelligent-dns',
      label: 'Edge DNS'
    },
    DataStream: {
      index: 6,
      tabName: 'data-stream',
      label: 'Data Stream'
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
