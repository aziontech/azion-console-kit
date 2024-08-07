<script setup>
  import { onMounted } from 'vue'
  import { DONUT_CHART_DATA } from './constants/data'
  import c3 from 'c3'

  onMounted(() => {
    generate()
  })

  const generate = () => {
    c3.generate({
      bindto: `#playground-donut-chart`,
      ...DONUT_CHART_DATA
    })
  }
</script>

<template>
  <div
    class="[&>svg]:w-auto [&>svg]:flex"
    :id="`playground-donut-chart`"
  />
</template>
