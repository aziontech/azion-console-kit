<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Metrics" />
    </template>
    <template #content>
      <!-- <MetricsBlock
      :fetchDataFromBeholderService="fetchDataFromBeholderService" /> -->
      <TabsPage :listAllDashboards="listAllDashboards" :tabsReportsMetricsService="tabsReportsMetricsService"
        :dropdownReportsMetricsService="dropdownReportsMetricsService" />
      <FilterPanel />
      <DashboardPanel />
    </template>
  </ContentBlock>
</template>

<script setup>
import ContentBlock from '@/templates/content-block'
import PageHeadingBlock from '@/templates/page-heading-block'
import TabsPage from './Blocks/TabsPage.vue'
import DashboardPanel from './Blocks/Dashboard/DashboardPanel'
import FilterPanel from './Blocks/Filter/FilterPanel.vue'

const props = defineProps({
  fetchDataFromBeholderService: {
    type: Function,
    required: true
  },
  searchDomainsMetricsService: {
    type: Function,
    required: true
  },
  listAllDashboards: {
    type: Array,
    required: true
  },

  tabsReportsMetricsService: {
    type: Function,
    required: true
  },
  dropdownReportsMetricsService: {
    type: Function,
    required: true
  }
})

async function loadDomains() {
  const domainLike = 'Joao'
  const data = await props.searchDomainsMetricsService({ domainLike })
  return data
}

loadDomains()
</script>
