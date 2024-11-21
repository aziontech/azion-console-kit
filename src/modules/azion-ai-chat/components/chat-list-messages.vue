<template>
  <div class="flex flex-col text-sm mx-auto flex-1 gap-4 md:max-w-3xl markdown">
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
  import '../assets/markdown.css'

  const { messages } = useChat()
</script>
