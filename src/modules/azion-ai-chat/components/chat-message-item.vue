<template>
  <div
    class="chat-message flex gap-3"
    :class="classRole[role]"
  >
    <ChatAvatar v-if="isSystem" />
    <div class="message-content">
      <div v-html="message" />
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import ChatAvatar from './chat-avatar.vue'
  import { marked } from 'marked'

  const props = defineProps({
    role: String,
    content: String
  })

  const message = computed(() => marked(props.content))
  const isSystem = computed(() => props.role === 'system')

  const classRole = {
    user: 'surface-300 ml-auto mt-5 break-words w-fit rounded-lg h-fit px-4 py-3',
    system: 'mr-auto mt-5'
  }
</script>
