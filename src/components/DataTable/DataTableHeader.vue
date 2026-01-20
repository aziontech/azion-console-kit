<template>
  <div
    class="flex flex-col w-full"
    data-testid="data-table-header"
    :class="{ 'gap-3': showDivider }"
  >
    <div class="px-3">
      <slot name="first-line" />
    </div>
    <Divider v-if="showDivider" />
    <div class="flex h-full justify-start gap-2 px-3">
      <slot name="second-line" />
    </div>
  </div>
</template>

<script setup>
  import Divider from 'primevue/divider'

  defineProps({
    showDivider: {
      type: Boolean,
      default: true
    }
  })
</script>
