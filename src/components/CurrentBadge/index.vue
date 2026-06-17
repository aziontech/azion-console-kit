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
    :pt="{
      root: { class: 'inline-flex items-center gap-1' },
      icon: { class: 'text-[10px] leading-none' },
      value: { class: 'leading-none' }
    }"
  />
</template>
