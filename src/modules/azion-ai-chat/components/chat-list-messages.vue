<!-- src/components/chat-messages.vue -->
<template>
  <div class="custom-scroll">
    <chat-message
      v-for="(message, index) in messages"
      :key="index"
      :role="message.role"
      :content="message.content"
    />
  </div>
</template>

<script setup>
  import ChatMessage from './chat-message-item.vue'

  defineProps({
    messages: Array
  })
</script>

<style>
  .custom-scroll::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scroll::-webkit-scrollbar-thumb {
    background-color: var(--primary-color);
    border-radius: 4px;
  }
</style>
