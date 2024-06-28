<template>
  <div class="flex w-full justify-between pl-6 md:pr-8 pr-3 py-3 border-b surface-border">
    <h3 class="text-color text-lg font-medium">
      Azion AI
      <PrimeTag
        class="ml-2"
        value="Experimental"
        v-tooltip.bottom="
          'Azion AI is in experimental mode and can give you some wrong answers. Please, always validate your answers.'
        "
        severity="info"
      />
    </h3>

    <slot name="header-actions"> </slot>
  </div>
</template>

<script setup>
  import PrimeTag from 'primevue/tag'

  defineOptions({
    name: 'azion-ai-chat-header'
  })
</script>
