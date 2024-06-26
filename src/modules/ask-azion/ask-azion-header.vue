<template>
  <div class="flex w-full justify-between pl-6 md:pr-8 pr-3 py-3 border-b surface-border">
    <h3 class="text-color text-lg font-medium">
      Ask Azion
      <PrimeTag
        class="ml-2"
        value="experimental"
      />
    </h3>

    <slot name="header-actions"> </slot>
  </div>
</template>

<script setup>
  import PrimeTag from 'primevue/tag'

  defineOptions({
    name: 'ask-azion-header'
  })
</script>
