<script setup>
  import PrimeButton from 'primevue/button'
  import { computed } from 'vue'

  defineOptions({ name: 'get-help' })

  const props = defineProps({
    prompt: {
      type: String
    },
    context: {
      type: Object,
      default: null
    }
  })

  const formatPrompt = computed(() => {
    if (!props.context) return props.prompt

    const replaceKeys = (text) => {
      return Object.keys(props.context).reduce((str, key) => {
        return str.replaceAll(`\${${key}}`, props.context[key])
      }, text)
    }

    return {
      user: replaceKeys(props.prompt.user),
      system: replaceKeys(props.prompt.system)
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
    v-prompt="formatPrompt"
  />
</template>
