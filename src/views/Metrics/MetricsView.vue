<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Metrics" />
    </template>
    <template #content>
      <!-- <MetricsBlock
      :fetchDataFromBeholderService="fetchDataFromBeholderService" /> -->
      <TabsPage @teste="loadDomains" @change:tabs="dashboadsItems" :tabsReportsMetricsService="tabsReportsMetricsService"
        :dropdownReportsMetricsService="dropdownReportsMetricsService" :tabs="tabsVarible" />
      <FilterPanel />
      <DashboardPanel :subDash="subDashVarible" />
    </template>
  </ContentBlock>
</template>

<script setup>
import ContentBlock from '@/templates/content-block'
import PageHeadingBlock from '@/templates/page-heading-block'
import TabsPage from './Blocks/TabsPage.vue'
import DashboardPanel from './Blocks/Dashboard/DashboardPanel'
import FilterPanel from './Blocks/Filter/FilterPanel.vue'
import { onMounted, ref } from 'vue'
import { object } from 'yup'

const props = defineProps({
  fetchDataFromBeholderService: {
    type: Function,
    required: true
  },

  searchDomainsMetricsService: {
    type: Function,
    required: true
  },

  tabsReportsMetricsService: {
    type: Function,
    required: true
  },

  dropdownReportsMetricsService: {
    type: Function,
    required: true
  },
})


onMounted(() => {
  tabItems.value = props.tabsReportsMetricsService()

  mapDropdownItems(tabItems.value)

})

const tabItems = ref([])
let tabsList = []
let tabsVarible = ref([])
let subDashVarible = ref([])

function mapDropdownItems(params) {

  const matTabs = params.map((element) => {
    return {
      parentId: element.id,
      pages: element.pagesDashboards
    }
  })

  tabsList.value = matTabs
}

function formatDash(params) {
  return {
    name: params?.label,
    url: params?.url,
    dataset: params?.dataset
  }
}

function dropdown(params) {
  const retornoMap = params.map((drop) => {
    return {
      label: drop.label, code: drop.id
    }
  })
}

function dashboadsItems(tabsIndex) {
  let index = tabsIndex

  const value = tabsVarible.value

  const retornoMap = value[index].dashboards.map((dash) => {
    return formatDash(dash)
  })

  subDashVarible.value = retornoMap
}

async function loadDomains(value) {
  let code = value
  if (value.value) code = value.value.code
  const result = tabsList.value.filter((element) => element.parentId === code);

  tabsVarible.value = result[0].pages

  //dashboadsItems(result[0].pages)
}

/*
async function loadDomains() {
  const domainLike = 'Joao'
  const data = await props.searchDomainsMetricsService({ domainLike })
  return data
}
loadDomains()
*/
</script>
