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
          <div class="h-96 flex items-center">
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

  const content = {
    granularity: {
      component: defineAsyncComponent(() => import('./maps/GeolocationMap.vue')),
      title: 'Geolocation Map'
    },
    bubbleMap: {
      component: defineAsyncComponent(() => import('./maps/BubbleMap.vue')),
      title: 'Bubble Map'
    },
    barChart: {
      component: defineAsyncComponent(() => import('./charts/BarChart.vue')),
      title: 'Bar Chart'
    },
    rotatedBarChart: {
      component: defineAsyncComponent(() => import('./charts/RotatedBarChart.vue')),
      title: 'Ordered Bar Chart'
    },
    stackedBarChart: {
      component: defineAsyncComponent(() => import('./charts/StackedBarChart.vue')),
      title: 'Stacked Bar Chart'
    },
    pieChart: {
      component: defineAsyncComponent(() => import('./charts/PieChart.vue')),
      title: 'Pie Chart'
    },
    donutChart: {
      component: defineAsyncComponent(() => import('./charts/DonutChart.vue')),
      title: 'Donut Chart'
    },
    gaugeChart: {
      component: defineAsyncComponent(() => import('./charts/GaugeChart.vue')),
      title: 'Gauge Chart'
    },
    areaChart: {
      component: defineAsyncComponent(() => import('./charts/AreaChart.vue')),
      title: 'Area Chart'
    }
  }
</script>
