<template>
  <div
    class="flex flex-wrap justify-between gap-2 w-full"
    data-testid="data-table-header"
  >
    <slot />
  </div>
</template>

<script setup>
  defineProps({
    class: {
      type: [String, Object, Array],
      default: ''
    }
  })
</script>
