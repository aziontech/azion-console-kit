<template>
  <div
    class="flex gap-2 items-center"
    :class="containerClass"
    data-testid="data-table-actions"
  >
    <slot />
  </div>
</template>

<script setup>
  defineProps({
    containerClass: {
      type: [String, Object, Array],
      default: ''
    }
  })
</script>
