<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import PrimeButton from 'primevue/button'
  import PrimeMenu from 'primevue/menu'
  import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'
  import MetricsCard from './metrics-card.vue'

  const STORAGE_KEY = 'azion-home-metrics-filters'

  const resourceOptions = [
    { label: 'WAF Rules', value: 'waf' },
    { label: 'Workloads', value: 'workloads' }
  ]

  const timeRangeOptions = [
    { label: 'Last Hour', value: 'last-hour' },
    { label: 'Last Day', value: 'last-day' },
    { label: 'Last Week', value: 'last-week' }
  ]
  const filterMenu = ref()
  // const isLoading = ref(false)
  const lastUpdated = ref(null)
  const storedFilters = getStoredFilters()
  const selectedResource = ref(storedFilters.resource)
  const selectedTimeRange = ref(storedFilters.timeRange)

  const metricsData = ref([
    {
      label: 'Total Data Transfered',
      value: '218.8',
      unit: 'MB',
      tooltip: 'Total amount of data transferred through the edge',
      trend: {
        direction: 'up',
        percentage: '6.62%'
      }
    },
    {
      label: 'Requests',
      value: '5',
      unit: '/s',
      tooltip: 'Number of requests per second',
      trend: {
        direction: 'down',
        percentage: '6.62%'
      }
    },
    {
      label: 'Bandwidth Saving',
      value: '20.8',
      unit: 'MB',
      tooltip: 'Bandwidth saved through caching and optimization',
      trend: {
        direction: 'up',
        percentage: '6.62%'
      }
    },
    {
      label: 'Data Transf. Offload',
      value: '49',
      unit: '%',
      tooltip: 'Percentage of data transfer offloaded to the edge',
      trend: {
        direction: 'up',
        percentage: '86.62%'
      }
    }
  ])

  const filterMenuItems = computed(() => [
    {
      label: 'Filter by Resource',
      items: resourceOptions.map((resource) => ({
        label: resource.label,
        icon: selectedResource.value === resource.value ? 'pi pi-check' : undefined,
        command: () => {
          selectedResource.value = resource.value
        }
      }))
    },
    { separator: true },
    {
      label: 'Filter by Time',
      items: timeRangeOptions.map((timeRange) => ({
        label: timeRange.label,
        icon: selectedTimeRange.value === timeRange.value ? 'pi pi-check' : undefined,
        command: () => {
          selectedTimeRange.value = timeRange.value
        }
      }))
    }
  ])

  const formattedTimestamp = computed(() => {
    if (!lastUpdated.value) {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      return `${formatDateToDayMonthYearHour(oneHourAgo)} - ${formatDateToDayMonthYearHour(now)}`
    }
    return lastUpdated.value
  })

  const toggleFilterMenu = (event) => {
    filterMenu.value.toggle(event)
  }

  const loadMetrics = async () => {
    return

    // isLoading.value = true
    // try {
    //   const response = await props.metricsService({
    //     resource: selectedResource.value,
    //     timeRange: selectedTimeRange.value
    //   })
    //   metricsData.value = response
    //   lastUpdated.value = formattedTimestamp.value
    // } catch (error) {
    //   console.error('Failed to load metrics:', error)
    // } finally {
    //   isLoading.value = false
    // }
  }

  const saveFiltersToStorage = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        resource: selectedResource.value,
        timeRange: selectedTimeRange.value
      })
    )
  }

  function getStoredFilters() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }

    return { resource: 'workloads', timeRange: 'last-hour' }
  }

  watch(
    [selectedResource, selectedTimeRange],
    () => {
      saveFiltersToStorage()
      loadMetrics()
    },
    { immediate: false }
  )

  onMounted(() => {
    loadMetrics()
  })
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="flex gap-3 items-center h-7">
      <span class="text-base font-semibold">Metrics</span>
      <div class="relative">
        <PrimeButton
          icon="ai ai-filter-alt"
          severity="secondary"
          text
          @click="toggleFilterMenu"
        />
        <PrimeMenu
          ref="filterMenu"
          :model="filterMenuItems"
          :popup="true"
          :pt="{
            submenuHeader: { class: 'text-[10px]' }
          }"
        >
          <template #submenulabel="{ item }">
            <span class="text-[10px] uppercase tracking-[1px] text-color-secondary font-medium">
              {{ item.label }}
            </span>
          </template>
          <template #item="{ item, props }">
            <a
              v-bind="props.action"
              class="flex items-center justify-between w-full px-3 py-2 text-xs"
            >
              <span>{{ item.label }}</span>
              <i
                v-if="item.icon"
                :class="item.icon"
                class="text-sm"
              />
            </a>
          </template>
        </PrimeMenu>
      </div>
    </div>

    <div class="flex flex-col gap-2 w-full relative">
      <div
        class="border border-[var(--surface-border)] rounded-md overflow-hidden flex flex-wrap w-full"
      >
        <MetricsCard
          v-for="(metric, index) in metricsData"
          :key="index"
          :metric="metric"
          :index="index"
        />
      </div>

      <div class="flex justify-end absolute bottom-[-25px] right-0">
        <span class="text-[10px] text-[var(--text-color-secondary)]">
          {{ formattedTimestamp }}
        </span>
      </div>
    </div>
  </div>
</template>
