<template>
  <div class="flex gap-2 justify-between text-color text-xs font-normal">
    <p>{{ data?.label }}</p>
    <p>{{ data?.value }}</p>
  </div>
</template>

<script setup>
  defineProps({
    data: {
      type: Object,
      default: () => {}
    }
  })
</script>
