<script setup>
  import PrimeButton from 'primevue/button'
  import { defineProps } from 'vue'

  const props = defineProps({
    text: {
      type: String,
      required: true
    },
    iconSrc: {
      type: String,
      required: true
    }
  })
</script>

<template>
  <PrimeButton
    class="w-45 h-25 p-4 gap-4 rounded-md cursor-pointer font-inherit text-none border-1 bg-surface-section outline-surface-50 border-surface-600 box-border text-text-color-secondary text-sm leading-5 flex flex-col items-start justify-start"
    :icon="iconSrc"
    :label="props.text"
  />
</template>
