<template>
  <div class="flex flex-col text-sm">
    <chat-message
      v-for="(message, index) in messages"
      :key="index"
      :message="message"
    />
  </div>
</template>

<script setup>
  import ChatMessage from './chat-message-item.vue'
  import { useChat } from '../composables/use-chat'

  const { messages } = useChat()
</script>

