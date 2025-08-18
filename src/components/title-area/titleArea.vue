<template>
  <div class="text-color text-xl font-medium flex gap-2 items-center">
    {{ title }}
  </div>
</template>

<script setup>
  defineProps({
    title: {
      type: String,
      required: true
    }
  })
</script>
