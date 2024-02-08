<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import RealTimeEventsHTTPRequestsListView from '@/views/RealTimeEventsHTTPRequests/ListView.vue'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from 'primevue/usetoast'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

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

  const getTabFromValue = (selectedTabIndex) => {
    const tabNames = Object.keys(mapTabs.value)
    const selectedTab = tabNames.find((tabName) => mapTabs.value[tabName] === selectedTabIndex)
    return selectedTab
  }

  const changeRouteByClickingOnTab = ({ index = 0 }) => {
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

  const isEnableApplicationAcceleration = computed(() => {
    return edgeApplication.value?.applicationAcceleration
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
