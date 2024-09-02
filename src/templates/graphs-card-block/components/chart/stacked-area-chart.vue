<script setup>
  import { onMounted } from 'vue'
  import c3 from 'c3'

  onMounted(() => {
    generate()
  })

  const props = defineProps({
    chartData: Object,
    resultChart: Array
  })

  const generate = () => {
    c3.generate({
      bindto: `#stacked-area-chart-${props.resultChart[0].id.id}`,
      ...props.resultChart[0]
    })
  }
</script>

<template>
  <div
    class="[&>svg]:w-auto [&>svg]:flex"
    :id="`stacked-area-chart-${props.resultChart[0].id.id}`"
  />
</template>
