<template>
  <div
    class="flex flex-auto flex-col overflow-x-hidden p-6 pt-3"
    :class="{ 'justify-center gap-6': !state.conversationStarted }"
    ref="chatContainer"
  >
    <template v-if="!state.conversationStarted">
      <Welcome />

      <Suggestions
        :suggestions="suggestionsTest"
        @selectSuggestion="sendMessage"
      />
    </template>

    <ChatMessages
      v-else
      :messages="state.messages"
    />
  </div>

  <ChatInput @sendMessage="sendMessage" />
</template>

<script setup>
  import Welcome from '../components/chat-welcome.vue'
  import ChatInput from '../components/chat-input.vue'
  import ChatMessages from '../components/chat-list-messages.vue'
  import Suggestions from '../components/chat-suggestions.vue'
  import { useChat } from '../composables/use-chat.js'
  import { nextTick, ref, watch } from 'vue'

  defineOptions({
    name: 'AzionAiChatLayout'
  })

  const { sendMessage, state } = useChat()

  const suggestionsTest = [
    {
      icon: 'pi pi-question-circle',
      title: 'How do I build an edge application?',
      context: 'How do I build an edge application?'
    },
    {
      icon: 'pi pi-shield',
      title: 'How do I protect my application?',
      context: 'How do I protect my application?'
    },
    {
      icon: 'pi pi-shield',
      title: 'How do I protect my application?',
      context: 'How do I protect my application?'
    },
    {
      icon: 'pi pi-shield',
      title: 'How do I protect my application?',
      context: 'How do I protect my application?'
    }
  ]

  const chatContainer = ref(null)

  const scrollToBottom = () => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }

  watch(
    () => state.messages,
    async () => {
      await nextTick()
      scrollToBottom()
    },
    { deep: true, flush: 'post' }
  )
</script>
