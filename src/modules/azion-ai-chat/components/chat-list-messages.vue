<!-- src/components/chat-messages.vue -->
<template>
  <div class="flex flex-col text-sm">
    <chat-message
      v-for="(message, index) in messages"
      :key="index"
      :role="message.role"
      :content="message.content"
      :isInProgress="message.isInProgress"
    />
  </div>
</template>

<script setup>
  import ChatMessage from './chat-message-item.vue'

  defineProps({
    messages: Array
  })
</script>
