<script setup>
  import { computed } from 'vue'
  import Tag from 'primevue/tag'

  const props = defineProps({
    operation: {
      type: String,
      required: true
    }
  })

  const severityMap = {
    created: 'success',
    deleted: 'danger',
    changed: 'info',
    edited: 'info'
  }

  const severity = computed(() => {
    return severityMap[props.operation?.toLowerCase()] || 'info'
  })

  const formattedOperation = computed(() => {
    if (!props.operation) return ''
    return props.operation.charAt(0).toUpperCase() + props.operation.slice(1).toLowerCase()
  })
</script>

<template>
  <Tag
    :severity="severity"
    :value="formattedOperation"
    class="text-xs"
  />
</template>
