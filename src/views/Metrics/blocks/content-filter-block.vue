<script setup>
  import PrimeButton from 'primevue/button'
  import advancedFilter from '@/templates/advanced-filter'

  const props = defineProps({
    playgroundOpener: {
      type: Function,
      required: true
    }
  })
</script>
<template>
  <div class="flex w-full items-center flex-column gap-4 md:gap-2 md:flex-row">
    <advancedFilter
      :fieldsInFilter="[]"
      @applyFilter="console.log"
    />
    <PrimeButton
      class="h-8 w-full md:max-w-fit"
      outlined
      icon-pos="right"
      icon="pi pi-external-link"
      label="Open in GraphQL Playground"
      @click="props.playgroundOpener()"
      :disabled="true"
    />
  </div>
</template>
