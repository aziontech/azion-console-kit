<template>
  <small
    class="text-xs text-color-secondary font-normal leading-5"
    v-html="description"
  />
</template>

<script setup>
  defineProps({
    description: {
      type: String,
      required: true
    }
  })
</script>
