<script setup>
  import { onMounted } from 'vue'
  import { STACKED_LINE_CHART_DATA } from './constants/data'
  import c3 from 'c3'

  onMounted(() => {
    generate()
  })

  const generate = () => {
    c3.generate({
      bindto: `#playground-stacked-line-chart`,
      ...STACKED_LINE_CHART_DATA
    })
  }
</script>

<template>
  <div
    class="[&>svg]:w-auto [&>svg]:flex"
    :id="`playground-stacked-line-chart`"
  />
</template>
