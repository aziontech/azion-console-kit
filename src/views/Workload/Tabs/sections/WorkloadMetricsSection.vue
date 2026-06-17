<script setup>
  import { reactive, ref, watch } from 'vue'
  import MetricsCard from '@/templates/home-cards-block/metrics-card.vue'
  import { workloadMetricsService } from '@/services/v2/workload/workload-metrics-service'

  defineOptions({ name: 'workload-metrics-section' })

  const props = defineProps({
    workloadId: { type: [String, Number], required: true }
  })

  const range = ref('24h')
  const isLoading = ref(true)
  const metrics = reactive({
    items: [
      { key: 'requests', label: 'Requests', value: '--', unit: '', isLoading: true },
      { key: 'bandwidth', label: 'Bandwidth', value: '--', unit: '', isLoading: true },
      { key: 'latency', label: 'p95 Latency', value: '--', unit: '', isLoading: true },
      { key: 'errors', label: '5xx Errors', value: '--', unit: '', isLoading: true }
    ]
  })

  const loadMetrics = async () => {
    isLoading.value = true
    metrics.items = metrics.items.map((item) => ({ ...item, isLoading: true }))
    try {
      const result = await workloadMetricsService.loadWorkloadMetricsService(props.workloadId, {
        range: range.value,
        skipCache: true
      })
      const next = Array.isArray(result?.body) ? result.body : []
      if (next.length) {
        metrics.items = next.map((item) => ({ ...item, isLoading: false }))
      } else {
        metrics.items = metrics.items.map((item) => ({ ...item, isLoading: false }))
      }
    } finally {
      isLoading.value = false
    }
  }

  watch(() => props.workloadId, loadMetrics, { immediate: true })
  watch(range, loadMetrics)
</script>

<template>
  <section
    class="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-section)] relative mb-5"
    data-testid="workload-overview__metrics-section"
  >
    <div class="flex flex-wrap overflow-hidden rounded-b-lg">
      <MetricsCard
        v-for="(metric, index) in metrics.items"
        :key="metric.key || index"
        :metric="metric"
        :index="index"
        class="flex-1 basis-1/2 xl:basis-0"
      />
    </div>
    <div class="flex justify-end absolute top-[10px] right-[10px]">
      <span class="text-xs font-protomono text-[var(--text-color-secondary)]"> Last 24 hours </span>
    </div>
  </section>
</template>
