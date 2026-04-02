<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeMenu from '@aziontech/webkit/menu'
  import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'
  import { useHomeMetrics } from '@/composables/useHomeMetrics'
  import MetricsCard from './metrics-card.vue'

  const resourceOptions = [
    { label: 'WAF Rules', value: 'waf' },
    { label: 'Workloads', value: 'workloads' }
  ]

  const filterMenu = ref()

  const {
    selectedResource,
    selectedTimeRange,
    metricsData,
    timeRangeOptions,
    loadMetrics,
    updateFilters
  } = useHomeMetrics()

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
    const selectedOption = timeRangeOptions.find((opt) => opt.value === selectedTimeRange.value)
    const hours = selectedOption?.hours || 1

    const now = new Date()
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)

    return `${formatDateToDayMonthYearHour(startTime)} - ${formatDateToDayMonthYearHour(now)}`
  })

  const toggleFilterMenu = (event) => {
    filterMenu.value.toggle(event)
  }

  watch([selectedResource, selectedTimeRange], updateFilters, { immediate: false })

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
        class="border border-[var(--surface-border)] rounded-md overflow-hidden grid grid-cols-2 xl:grid-cols-4 w-full m-0"
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
