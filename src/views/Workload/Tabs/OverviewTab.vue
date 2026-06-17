<script setup>
  import WorkloadMetricsSection from './sections/WorkloadMetricsSection.vue'
  import CurrentVersionSection from './sections/CurrentVersionSection.vue'
  import VersionHistorySection from './sections/VersionHistorySection.vue'

  defineOptions({ name: 'workload-overview-tab' })

  defineProps({
    workloadId: { type: [String, Number], required: true },
    workload: { type: Object, default: () => null }
  })
</script>

<template>
  <div class="flex flex-col gap-4 mt-4">
    <WorkloadMetricsSection :workloadId="workloadId" />
    <CurrentVersionSection
      :workloadId="workloadId"
      :workload="workload"
    />
    <VersionHistorySection :workloadId="workloadId" />
  </div>
</template>
