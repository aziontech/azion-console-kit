<template>
  <div class="px-3 sm:px-8 pt-4 sm:pt-8 pb-14 flex flex-col gap-8 sm:gap-6 w-full">
    <MetricsBlock :fetchDataFromBeholderService="fetchDataFromBeholderService" />
  </div>
</template>

<script setup>
  import MetricsBlock from '@/templates/metrics-block'
  defineProps({
    fetchDataFromBeholderService: {
      type: Function,
      required: true
    },
    searchDomainsMetricsService: {
      type: Function,
      required: true
    }
  })
  async function loadDomains() {
    return
  }
  loadDomains()
</script>
