<script setup>
  import { onMounted } from 'vue'
  import c3 from 'c3'

  onMounted(() => {
    generate()
  })

  const props = defineProps({
    resultChart: {
      type: Array,
      default: () => []
    }
  })

  const generate = () => {
    c3.generate({
      bindto: `#gauge-chart-${props.resultChart[0].id}`,
      ...props.resultChart[0]
    })
  }
</script>

<template>
  <div
    class="[&>svg]:w-auto [&>svg]:flex"
    :id="`gauge-chart-${props.resultChart[0].id}`"
  />
</template>
