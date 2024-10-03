<script setup>
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'get-help' })

  const props = defineProps({
    prompt: {
      type: String
    }
  })
</script>

<template>
  <PrimeButton
    link
    size="small"
    label="Get Help"
    icon="ai ai-ask-azion"
    icon-pos="right"
    v-prompt="props.prompt"
  />
</template>
