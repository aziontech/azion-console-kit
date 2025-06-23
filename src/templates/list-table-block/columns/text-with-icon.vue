<template>
  <div class="gap-2 flex items-center">
    <i
      v-if="props.leftIcon"
      :class="props.leftIcon"
    ></i>
    <p>{{ text }}</p>
    <i
      v-if="props.rightIcon"
      :class="props.rightIcon"
    ></i>
  </div>
</template>

<script setup>
  const props = defineProps({
    text: String,
    leftIcon: String,
    rightIcon: String
  })
</script>
