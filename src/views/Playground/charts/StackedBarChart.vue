<script setup>
  import { onMounted } from 'vue'
  import { STACKED_BAR_CHART_DATA } from './constants/data'
  import c3 from 'c3'

  onMounted(() => {
    generate()
  })

  const generate = () => {
    c3.generate({
      bindto: `#playground-stacked-bar-chart`,
      ...STACKED_BAR_CHART_DATA
    })
  }
</script>

<template>
  <div
    class="[&>svg]:w-auto [&>svg]:flex"
    :id="`playground-stacked-bar-chart`"
  />
</template>
