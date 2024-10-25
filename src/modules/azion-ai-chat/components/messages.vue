<template>
  <div>
    <MessagesList :messages="messages" />
  </div>
</template>

<script setup>
  import MessagesList from './MessagesList.vue'

  const props = defineProps({
    messages: {
      type: Array,
      required: true
    }
  })
</script>
