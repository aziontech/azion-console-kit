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
        <TabPanel
          :header="tab.title"
          v-for="tab in tabPanels"
          :key="tab.index"
        >
          <TabPanelBlock
            ref="tabPanelBlockRef"
            v-if="tab.index === tabSelectIndex"
            :loadFieldsData="loadFieldsWithOperator"
            :listService="selectedTabProps.listService"
            :loadService="selectedTabProps.loadService"
            :allFields="allFields"
            :tabSelected="tab"
          />
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, onBeforeMount, ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import TabPanelBlock from '@/views/RealTimeEvents/Blocks/tab-panel-block.vue'
  import TABS_EVENTS from '@/views/RealTimeEvents/Blocks/constants/tabs-events'
  import {
    buildFieldsQuery,
    adapterFields,
    buildOperatorQuery
  } from '@/views/RealTimeEvents/Blocks/constants/query-fields'

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
    },
    loadFieldsData: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const router = useRouter()
  const tabPanelBlockRef = ref(null)
  const tabSelectIndex = ref(undefined)
  const fieldsDefault = ref({})
  const tabPanels = Object.values(TABS_EVENTS)
  const allFields = ref([])

  const selectedTabProps = computed(() => {
    const { panel } = tabPanels[tabSelectIndex.value]
    return props[panel] || {}
  })

  const changePage = async ({ index }) => {
    const tab = tabPanels.find((tab) => tab.index === index)
    selectedTab(tab)
    await loadFieldsWithOperator(tabPanels[tabSelectIndex.value])
  }

  const updateRouter = (tabRouter) => {
    const { name, query, params } = route
    router.push({
      name,
      params: {
        ...params,
        tab: tabRouter
      },
      query
    })
  }

  const selectedTab = (tabSelectValue) => {
    tabSelectIndex.value = tabSelectValue.index
    updateRouter(tabSelectValue.tabRouter)
  }

  const tabSelectInitial = () => {
    const { params } = route
    if (params.tab) {
      const tabSelect = tabPanels.find((tab) => tab.tabRouter === params.tab)
      selectedTab(tabSelect)
      return
    }

    selectedTab(tabPanels[0])
  }

  const loadFieldsDataset = async () => {
    fieldsDefault.value = await props.loadFieldsData({
      query: buildFieldsQuery()
    })    
    await loadFieldsWithOperator(tabPanels[tabSelectIndex.value])
  }

  let abortController = null
  const loadFieldsWithOperator = async (tabSelected) => {
    if (abortController) abortController.abort()
    abortController = new AbortController()

    const { dataset } = tabSelected
    const graphqlQuery = { query: buildOperatorQuery(dataset) }

    try {
      const operatorsData = await props.loadFieldsData({
        ...graphqlQuery,
        signal: abortController.signal
      })

      allFields.value = adapterFields(fieldsDefault, operatorsData, dataset)
    } catch (error) {
      if (error.name !== 'AbortError') {
        allFields.value = []
      }
    }
  }

  onBeforeMount(() => {
    tabSelectInitial()
  })

  onMounted(() => {
    loadFieldsDataset()
  })
</script>
