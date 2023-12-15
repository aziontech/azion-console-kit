<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Metrics" />
    </template>
    <template #content>
      <!-- <MetricsBlock
      :fetchDataFromBeholderService="fetchDataFromBeholderService" /> -->
      <ReportsPanel
        :tabsReportsMetricsService="tabsReportsMetricsService"
        :dropdownReportsMetricsService="dropdownReportsMetricsService"
      />
      <FilterPanel />
      <DashboardPanel />
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DashboardPanel from './Blocks/DashboardPanel'
  import ReportsPanel from './Blocks/ReportsPanel'
  import FilterPanel from './Blocks/FilterPanel'
  // import MetricsBlock from '@/templates/metrics-block'

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
    }
  })

  async function loadDomains() {
    const domainLike = 'Joao'
    const data = await props.searchDomainsMetricsService({ domainLike })
    return data
  }

  loadDomains()
</script>
