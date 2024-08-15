<template>
  <div class="w-full h-full grid grid-cols-12 gap-4 p-8">
    <template
      v-for="chart in CHARTS"
      :key="chart.title"
    >
      <Card class="p-3 md:p-6 col-span-12 lg:col-span-6">
        <template #title>
          <div class="flex flex-col gap-3">
            <span class="text-base font-medium">{{ chart.title }}</span>
            <span class="text-color-secondary text-sm font-normal">{{ chart.description }}</span>
          </div>
        </template>
        <template #content>
          <div
            class="mt-auto h-96 min-h-96 flex items-center relative"
            v-if="showContent"
          >
            <component :is="chart.component" />
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
  import Skeleton from 'primevue/skeleton'

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

  const CHARTS = [
    {
      component: defineAsyncComponent(() => import('./maps/MapChart.vue')),
      title: 'Map',
      description:
        'Highlights areas of high activity while also showing the volume of data by location. Ideal for analyzing patterns, hotspots, and the significance of data points across a region.'
    },
    {
      component: defineAsyncComponent(() => import('./charts/BarChart.vue')),
      title: 'Bar Chart',
      description:
        'Displays data using rectangular bars, with length representing value. Useful for comparing quantities across different categories.'
    },
    {
      component: defineAsyncComponent(() => import('./charts/RotatedBarChart.vue')),
      title: 'Ordered Bar Chart',
      description:
        'A bar chart where bars are ordered by value, making it easy to identify the largest or smallest categories. Ideal for ranking and comparisons.'
    },
    {
      component: defineAsyncComponent(() => import('./charts/StackedLineChart.vue')),
      title: 'Stacked Line Chart',
      description:
        'Lines are divided into segments representing subcategories. Useful for comparing parts of a whole across multiple categories.'
    },
    {
      component: defineAsyncComponent(() => import('./charts/StackedBarChart.vue')),
      title: 'Stacked Bar Chart',
      description:
        'Bars are divided into segments representing subcategories. Useful for comparing parts of a whole across multiple categories.'
    },
    {
      component: defineAsyncComponent(() => import('./charts/PieChart.vue')),
      title: 'Pie Chart',
      description:
        'Bars are divided into segments representing subcategories. Useful for comparing parts of a whole across multiple categories.'
    },
    {
      component: defineAsyncComponent(() => import('./charts/DonutChart.vue')),
      title: 'Donut Chart',
      description:
        'A variation of a pie chart with a central hole. It provides a similar view but can also display additional data in the center.'
    },
    {
      component: defineAsyncComponent(() => import('./charts/GaugeChart.vue')),
      title: 'Gauge Chart',
      description:
        'Displays a value within a range, often used to show progress or performance against a goal. Great for KPI tracking.'
    },
    {
      component: defineAsyncComponent(() => import('./charts/AreaChart.vue')),
      title: 'Area Chart',
      description:
        'A line chart where the area under the line is filled in, showing the magnitude of change over time. Useful for trend analysis and cumulative data.'
    },
    {
      component: defineAsyncComponent(() => import('./charts/ListChart.vue')),
      title: 'List Chart',
      description:
        'Diplays a data information to show in a list table format. Useful for displaying data in a table format. And manipulate columns to hide/show some information'
    }
  ]
</script>
