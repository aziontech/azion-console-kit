<template>
  <div class="flex flex-col gap-2 text-color text-xs font-normal">
    <p class="font-bold">{{ data?.label }}</p>
    <p>{{ data?.exhibitionValue }}</p>
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
