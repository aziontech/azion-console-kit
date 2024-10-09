<template>
  <div class="w-full h-full mx-auto px-8">
    <div class="w-full" id="chart"></div>
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import c3 from 'c3'
  import { BAR_CHART } from './mocks_data.js'

  const generateGraph = () => {
    c3.generate({
    bindto: '#chart',
    ...BAR_CHART
    })
  }

  onMounted( () => {
    generateGraph()
  })
</script>
