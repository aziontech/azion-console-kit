<template>
  <div class="w-full h-full mx-auto grid grid-cols-12 gap-4 p-8">
    <template
      v-for="chart in CHARTS"
      :key="chart.title"
    >
      <Card
        class="p-3 md:p-6"
        :class="classSizes(chart.size).cardCols"
      >
        <template #title>
          <div class="flex flex-col gap-3">
            <div class="flex w-full items-center justify-between gap-2">
              <span class="w-full gap-2 flex">
                <PrimeTag
                  icon="pi pi-user"
                  severity="info"
                  :pt="{ icon: { class: 'mr-0' } }"
                />
                <span class="text-base font-medium overflow-ellipsis break-all line-clamp-1">{{
                  chart.title
                }}</span>
              </span>
              <PrimeButton
                icon="pi pi-ellipsis-h"
                outlined
                size="small"
              />
            </div>

            <span
              v-if="chart.description"
              class="break-words text-sm text-color-secondary font-normal line-height-1 py-3.5"
            >
              {{ chart.description }}
            </span>
          </div>
        </template>
        <template #content>
          <div
            class="mt-auto flex items-center relative"
            :class="classSizes(chart.size).contentSize"
            v-if="showContent"
          >
            <component
              :is="chart.component"
              :data="chart.data"
            />
          </div>
          <Skeleton
            v-else
            class="h-96 w-full"
          />
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup>
  import { defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
  import Card from 'primevue/card'
  import PrimeButton from 'primevue/button'
  import PrimeTag from 'primevue/tag'
  import Skeleton from 'primevue/skeleton'

  import * as MOCKS from './mocks_data'

  const showContent = ref(true)
  const reRenderChart = () => {
    // This works around an issue with C3 charts on window resizing
    const timeout = 100

    showContent.value = false
    setTimeout(() => {
      showContent.value = true
    }, timeout)
  }

  onMounted(() => {
    window.addEventListener('resize', reRenderChart)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', reRenderChart)
  })

  const classSizes = (cols) => {
    return {
      cardCols: `col-span-12 lg:col-span-${cols}`,
      contentSize: cols <= 4 ? `h-auto` : `h-96 min-h-96`
    }
  }

  const CHARTS = [
    {
      component: defineAsyncComponent(() => import('./charts/StackedLineChart.vue')),
      title: 'Stacked Line Chart',
      size: 6,
      description:
        'Lines are divided into segments representing subcategories. Useful for comparing parts of a whole across multiple categories.',
      data: MOCKS.STACKED_LINE_CHART_DATA
    },
    {
      component: defineAsyncComponent(() => import('./charts/StackedBarChart.vue')),
      title: 'Stacked Bar Chart',
      size: 6,
      description:
        'Bars are divided into segments representing subcategories. Useful for comparing parts of a whole across multiple categories.',
      data: MOCKS.STACKED_BAR_CHART_DATA
    }
  ]
</script>
