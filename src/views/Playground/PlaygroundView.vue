<template>
  <div class="w-full h-full grid grid-cols-2 gap-4 p-8">
    <template
      v-for="value in content"
      :key="value.title"
    >
      <Card class="p-4">
        <template #title>
          {{ value.title }}
        </template>

        <template #content>
          <div class="h-96 flex items-center relative">
            <component :is="value.component" />
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup>
  import { defineAsyncComponent } from 'vue'
  import Card from 'primevue/card'

  const content = [
    {
      component: defineAsyncComponent(() => import('./maps/GeolocationMap.vue')),
      title: 'Geolocation Map'
    },
    {
      component: defineAsyncComponent(() => import('./maps/HeatmapMap.vue')),
      title: 'Heatmap Map'
    },
    {
      component: defineAsyncComponent(() => import('./maps/GranularityMap.vue')),
      title: 'Granularity by Country'
    },
    {
      component: defineAsyncComponent(() => import('./maps/BubbleMap.vue')),
      title: 'Bubble Map'
    },
    {
      component: defineAsyncComponent(() => import('./charts/BarChart.vue')),
      title: 'Bar Chart'
    },
    {
      component: defineAsyncComponent(() => import('./charts/RotatedBarChart.vue')),
      title: 'Ordered Bar Chart'
    },
    {
      component: defineAsyncComponent(() => import('./charts/StackedBarChart.vue')),
      title: 'Stacked Bar Chart'
    },
    {
      component: defineAsyncComponent(() => import('./charts/PieChart.vue')),
      title: 'Pie Chart'
    },
    {
      component: defineAsyncComponent(() => import('./charts/DonutChart.vue')),
      title: 'Donut Chart'
    },
    {
      component: defineAsyncComponent(() => import('./charts/GaugeChart.vue')),
      title: 'Gauge Chart'
    },
    {
      component: defineAsyncComponent(() => import('./charts/AreaChart.vue')),
      title: 'Area Chart'
    }
  ]
</script>
