<template>
  <div
    class="flex w-full justify-between pl-6 md:pr-8 pr-3 py-3 border-b surface-border sticky top-14 z-10 bg-inherit"
  >
    <h3 class="text-color text-lg font-medium">
      Copilot
      <PrimeTag
        v-tooltip.bottom="
          'Copilot is in preview mode and can give you some wrong answers. Please, always validate your answers.'
        "
        value="Preview"
        class="ml-2"
      />
    </h3>

    <div class="flex gap-4">
      <slot name="header-actions"></slot>
    </div>
  </div>
</template>

<script setup>
  import PrimeTag from 'primevue/tag'

  defineOptions({
    name: 'azion-ai-chat-header'
  })
</script>
