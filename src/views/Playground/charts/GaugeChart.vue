<script setup>
  import { onMounted } from 'vue'
  import { GAUGE_CHART_DATA } from './constants/data'
  import c3 from 'c3'

  onMounted(() => {
    generate()
  })

  const generate = () => {
    c3.generate({
      bindto: `#playground-gauge-chart`,
      ...GAUGE_CHART_DATA
    })
  }
</script>

<template>
  <div
    class="[&>svg]:w-auto [&>svg]:flex"
    :id="`playground-gauge-chart`"
  />
</template>
