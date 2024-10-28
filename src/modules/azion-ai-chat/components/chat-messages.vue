<!-- src/components/chat-messages.vue -->
<template>
  <div class="flex flex-auto flex-col overflow-x-hidden p-6 pt-3 custom-scroll">
    <chat-message v-for="(message, index) in messages" :key="index" :role="message.role" :content="message.content"
      :avatar-component="message.role === 'system' ? avatarComponent : null" />
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import ChatMessage from './chat-message.vue';

defineProps({
  messages: Array,
  avatarComponent: {
    type: [String, Object],
    default: null,
  },
});

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