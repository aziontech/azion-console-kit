<template>
  <li>
    <span>{{ message.content }}</span>
  </li>
</template>

<script setup>
  const props = defineProps({
    message: {
      type: Object,
      required: true
    }
  })
</script>
