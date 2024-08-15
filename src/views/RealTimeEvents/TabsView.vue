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
        <template
          :key="tab.tabName"
          v-for="tab in tabPanels"
        >
          <TabPanel :header="tab.label">
            <div class="flex flex-col gap-8 my-4">
              <div class="flex gap-1">
                <p class="text-xs font-medium leading-4">
                  {{ tab.description }}
                </p>
              </div>
            </div>
            <component
              :is="tab.component"
              v-bind="tab.props"
              ref="viewRef"
              v-model:filterData="filterData"
              v-if="tabActive(tab.table)"
            >
              <template #header="{ downloadCSV }">
                <ContentFilterBlock
                  v-model:filterData="filterData"
                  :downloadCSV="downloadCSV"
                />
              </template>
            </component>
          </TabPanel>
        </template>
      </TabView>
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import RealTimeEventsHTTPRequestsListView from '@/views/RealTimeEventsHTTPRequests/ListView'
  import RealTimeEventEdgeFunctionsListView from '@/views/RealTimeEventsEdgeFunctions/ListView'
  import RealTimeEventEdgeFunctionsConsoleListView from '@/views/RealTimeEventsEdgeFunctionsConsole/ListView'
  import RealTimeEventsDataStreamListView from '@/views/RealTimeEventsDataStream/ListView'
  import RealTimeEventsActivityHistoryListView from '@/views/RealTimeEventsActivityHistory/ListView'
  import RealTimeEventsEdgeDNSListView from '@/views/RealTimeEventsEdgeDNS/ListView'
  import RealTimeEventsImageProcessor from '@/views/RealTimeEventsImageProcessor/ListView'
  import RealTimeEventsTieredCache from '@/views/RealTimeEventsTieredCache/ListView'
  import ContentFilterBlock from '@/views/RealTimeEvents/blocks/content-filter-block.vue'

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
    edgeDNS: {
      type: Object,
      required: true
    },
    imageProcessor: {
      type: Object,
      required: true
    },
    tieredCache: {
      type: Object,
      required: true
    }
  })

  const route = useRoute()
  const router = useRouter()
  const tabSelectIndex = ref(0)
  const filterData = ref({
    tsRange: {},
    fields: []
  })
  const viewRef = ref(null)

  const mapTabs = {
    httpRequests: {
      index: 0,
      table: 'httpRequests',
      tabName: 'http-requests',
      label: 'HTTP Requests',
      props: props.httpRequests,
      description:
        'Logs of events from requests made to your edge applications and edge firewalls.',
      component: RealTimeEventsHTTPRequestsListView
    },
    EdgeFunctions: {
      index: 1,
      tabName: 'edge-functions',
      table: 'EdgeFunctions',
      label: 'Edge Functions',
      props: props.edgeFunctions,
      description: 'Logs of events from requests made to your edge functions.',
      component: RealTimeEventEdgeFunctionsListView
    },
    EdgeFunctionsConsole: {
      index: 2,
      tabName: 'edge-functions-console',
      label: 'Edge Functions Console',
      table: 'EdgeFunctionsConsole',
      props: props.edgeFunctionsConsole,
      description:
        'Logs of events from edge applications using Edge Runtime returned by Cells Console.',
      component: RealTimeEventEdgeFunctionsConsoleListView
    },
    ImageProcessor: {
      index: 3,
      tabName: 'image-processor',
      label: 'Image Processor',
      props: props.imageProcessor,
      table: 'ImageProcessor',
      description:
        'Logs of events from requests made to edge applications that processed images with Image Processor.',
      component: RealTimeEventsImageProcessor
    },
    TieredCache: {
      index: 4,
      tabName: 'tiered-cache',
      label: 'Tiered Cache',
      table: 'TieredCache',
      props: props.tieredCache,
      description: 'Logs of events from requests made to edge applications using Tiered Cache.',
      component: RealTimeEventsTieredCache
    },
    EdgeDNS: {
      index: 5,
      tabName: 'edge-dns',
      label: 'Edge DNS',
      table: 'EdgeDNS',
      props: props.edgeDNS,
      description: 'Logs of events from queries made to Edge DNS.',
      component: RealTimeEventsEdgeDNSListView
    },
    DataStream: {
      index: 6,
      tabName: 'data-stream',
      label: 'Data Stream',
      table: 'DataStream',
      props: props.dataStream,
      description: 'Logs of data sent to endpoints by Data Stream.',
      component: RealTimeEventsDataStreamListView
    },
    ActivityHistory: {
      index: 7,
      tabName: 'activity-history',
      label: 'Activity History',
      table: 'ActivityHistory',
      props: props.activityHistory,
      description:
        'Logs of events from an Azion account regarding activities registered on Activity History. Use the Real-Time Events GraphQL API to query up to 2 years of logs.',
      component: RealTimeEventsActivityHistoryListView
    }
  }

  const tabPanels = Object.values(mapTabs)

  const isActiveTab = computed(() => ({
    httpRequests: mapTabs.httpRequests.index === tabSelectIndex.value,
    EdgeFunctions: mapTabs.EdgeFunctions.index === tabSelectIndex.value,
    EdgeFunctionsConsole: mapTabs.EdgeFunctionsConsole.index === tabSelectIndex.value,
    ImageProcessor: mapTabs.ImageProcessor.index === tabSelectIndex.value,
    TieredCache: mapTabs.TieredCache.index === tabSelectIndex.value,
    EdgeDNS: mapTabs.EdgeDNS.index === tabSelectIndex.value,
    DataStream: mapTabs.DataStream.index === tabSelectIndex.value,
    ActivityHistory: mapTabs.ActivityHistory.index === tabSelectIndex.value
  }))

  const tabActive = (tab) => {
    return isActiveTab.value[tab]
  }

  const changePage = async ({ index }) => {
    const tab = tabPanels.find((tab) => tab.index === index)
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
      const tabSelect = tabPanels.find((tab) => tab.tabName === params.tab)
      selectedTab(tabSelect)
      return
    }

    selectedTab(tabPanels[0])
  }

  onMounted(() => {
    tabSelectInitial()
  })
</script>
