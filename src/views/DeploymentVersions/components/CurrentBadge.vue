<script setup>
  import Tag from '@aziontech/webkit/prime-tag'

  defineOptions({ name: 'deployment-current-badge' })

  defineProps({
    label: {
      type: String,
      default: 'Current'
    }
  })
</script>

<template>
  <Tag
    severity="info"
    icon="pi pi-arrow-up"
    :value="label"
  />
</template>
