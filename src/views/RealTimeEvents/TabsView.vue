<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Events" />
    </template>
    <template #content>
      <TabView
        :activeIndex="tabSelectIndex"
        class="w-full h-full"
        @tab-click="handleTabClick"
      >
        <TabPanel
          :header="tab.title"
          v-for="tab in tabPanels"
          :key="tab.index"
        >
          <TabPanelBlock
            v-if="isTabActive(tab)"
            :listService="selectedTabProps.listService"
            :loadService="selectedTabProps.loadService"
            :filterFields="generatedFilterFields"
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
  import { computed, ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import { GetRelevantField } from '@/modules/real-time-events/filters'
  import { FILTERS_RULES } from '@/helpers'

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
  const fieldAllDataset = ref({})
  const generatedFilterFields = ref([])

  const tabPanels = Object.values(TABS_EVENTS)

  const selectedTabProps = computed(() => {
    const { panel } = tabPanels[tabSelectIndex.value]
    return props[panel] || {}
  })

  const isTabActive = (tab) => {
    return tab.index === tabSelectIndex.value
  }

  const handleTabClick = async ({ index }) => {
    const tab = tabPanels.find((tab) => tab.index === index)
    await selectTab(tab)
    await fetchFieldsWithOperator(tabPanels[tabSelectIndex.value])
    tabPanelBlockRef.value?.reloadListTable()
  }

  const updateRouter = async (tabRouter) => {
    const { name, query, params } = route
    await router.push({
      name,
      params: {
        ...params,
        tab: tabRouter
      },
      query
    })
  }

  const selectTab = async (tabSelectValue) => {
    tabSelectIndex.value = tabSelectValue.index
    await updateRouter(tabSelectValue.tabRouter)
  }

  const initializeTabSelection = async () => {
    const { params } = route
    if (params.tab) {
      const selectedTab = tabPanels.find((tab) => tab.tabRouter === params.tab)
      await selectTab(selectedTab)
      return
    }

    await selectTab(tabPanels[0])
  }

  const loadFieldsAndOperators = async () => {
    fieldAllDataset.value = await props.loadFieldsData({
      query: buildFieldsQuery()
    })
    await fetchFieldsWithOperator(tabPanels[tabSelectIndex.value])
  }

  const sortByMostRelevantFilters = (filters) => {
    const { dataset } = tabPanels[tabSelectIndex.value]
    const newOptions = filters.map(({ label, operator, value }) => {
      const mostRelevant = GetRelevantField(label, dataset)
      return {
        label,
        value,
        mostRelevant,
        operator
      }
    })

    FILTERS_RULES.sortFields(newOptions)
    return newOptions
  }

  let abortController = null
  const fetchFieldsWithOperator = async (tabSelected) => {
    if (abortController) abortController.abort()
    abortController = new AbortController()

    const { dataset } = tabSelected
    const graphqlQuery = { query: buildOperatorQuery(dataset) }

    try {
      const operatorsData = await props.loadFieldsData({
        ...graphqlQuery,
        signal: abortController.signal
      })

      const filters = adapterFields(fieldAllDataset.value, operatorsData, dataset)
      generatedFilterFields.value = sortByMostRelevantFilters(filters)
    } catch (error) {
      if (error.name !== 'AbortError') {
        generatedFilterFields.value = []
      }
    }
  }

  onMounted(() => {
    initializeTabSelection()
    loadFieldsAndOperators()
  })
</script>
