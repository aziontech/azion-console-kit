<template>
  <div
    class="text-color-secondary text-sm font-normal flex flex-col gap-2"
    style="white-space: pre-line"
  >
    {{ description }}
  </div>
</template>

<script setup>
  defineProps({
    description: {
      type: String,
      required: true
    }
  })
</script>
  