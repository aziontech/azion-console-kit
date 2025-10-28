<template>
  <div
    class="flex flex-col gap-2 w-full"
    data-testid="data-table-header"
  >
    <slot name="actions" />
    <Divider v-if="hasFiltersSlot" />
    <slot name="filters" />
  </div>
</template>

<script setup>
  import Divider from 'primevue/divider'
  import { computed, useSlots } from 'vue'

  const slots = useSlots()
  const hasFiltersSlot = computed(() => !!slots.filters)
</script>
