<template>
  <div class="gap-2 flex items-center">
    <p>{{ text }}</p>
  </div>
</template>

<script setup>
  defineProps({
    text: String
  })
</script>
