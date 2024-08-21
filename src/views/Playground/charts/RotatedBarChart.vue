<script setup>
  import { onMounted } from 'vue'
  import c3 from 'c3'

  onMounted(() => {
    generate()
  })

  const props = defineProps({
    data: {
      type: Object,
      required: true
    }
  })

  const generate = () => {
    c3.generate({
      bindto: `#rotate-bar-chart-${props.data.id}`,
      ...props.data
    })
  }
</script>

<template>
  <div
    class="[&>svg]:w-auto [&>svg]:flex"
    :id="`rotate-bar-chart-${props.data.id}`"
  />
</template>
