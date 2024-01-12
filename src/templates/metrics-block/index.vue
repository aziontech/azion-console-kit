<template>
  <div>Hello from metrics-block</div>
</template>

<script setup>
  defineOptions({ name: 'metrics-block' })

  defineProps({
    fetchDataFromBeholderService: {
      type: Function,
      required: false
    }
  })
</script>
