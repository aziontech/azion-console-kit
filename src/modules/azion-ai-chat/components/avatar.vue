<!-- src/components/avatar.vue -->
<template>
  <component
    :is="avatarComponent"
    class="avatar min-h-max min-w-max"
  />
</template>

<script setup>
  import DefaultAvatar from '../assets/azion-logo.vue'

  defineProps({
    avatarComponent: {
      type: [String, Object],
      default: DefaultAvatar
    }
  })
</script>
