<template>
  <div
    class="flex w-full justify-between pl-6 md:pr-8 pr-3 py-3 border-b surface-border sticky top-14 z-10 bg-inherit"
  >
    <h3 class="text-color text-lg font-medium">
      Copilot
      <PrimeTag
        class="ml-2"
        value="Experimental"
        v-tooltip.bottom="experimentalMessageWarning"
        severity="info"
      />
    </h3>

    <div class="flex gap-4">
      <slot name="header-actions"></slot>
    </div>
  </div>
</template>

<script setup>
  import PrimeTag from 'primevue/tag'
  import { ref } from 'vue'

  defineOptions({
    name: 'azion-ai-chat-header'
  })

  const experimentalMessageWarning = ref(
    'Copilot is in the experimental stage and may generate inaccurate or misleading information. Always validate its answers.'
  )
</script>
