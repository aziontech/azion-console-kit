<script setup>
  import { computed } from 'vue'
  import Tag from '@aziontech/webkit/prime-tag'

  defineOptions({ name: 'deployment-environment-tag' })

  const props = defineProps({
    environment: {
      type: String,
      default: ''
    }
  })

  const ENVIRONMENT_SEVERITY = {
    production: 'success',
    staging: 'primary'
  }

  const severity = computed(() => {
    const env = props.environment?.trim().toLowerCase()
    return ENVIRONMENT_SEVERITY[env] || 'secondary'
  })

  const label = computed(() =>
    props.environment
      ? props.environment.charAt(0).toUpperCase() + props.environment.slice(1)
      : 'Environment'
  )
</script>

<template>
  <Tag
    :severity="severity"
    :value="label"
  />
</template>
