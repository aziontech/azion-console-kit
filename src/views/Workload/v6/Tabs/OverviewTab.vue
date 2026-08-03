<script setup>
  import WorkloadMetricsSection from '@/views/Workload/v6/Tabs/sections/WorkloadMetricsSection.vue'
  import WorkloadReleasesSection from '@/views/Workload/v6/Tabs/sections/WorkloadReleasesSection.vue'

  defineOptions({ name: 'workload-overview-tab' })

  defineProps({
    workloadId: { type: [String, Number], required: true },
    workload: { type: Object, default: () => null }
  })
</script>

<template>
  <div class="flex flex-col gap-4 mt-4">
    <WorkloadMetricsSection :workloadId="workloadId" />
    <WorkloadReleasesSection
      :workloadId="workloadId"
      :workload="workload"
    />
  </div>
</template>
