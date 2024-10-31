<template>
  <div
    class="mx-auto flex flex-1 text-base md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem] flex-col w-full"
  >
    <div
      class="flex flex-auto flex-col overflow-x-hidden p-6 pt-3 custom-scroll max-h-[calc(100vh-24.5rem)]"
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
        :loading="state.isResponding"
      />
    </div>

    <ChatInput
      @sendMessage="sendMessage"
      @stopResponding="abortRequest"
    />
  </div>
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

  const { sendMessage, state, abortRequest } = useChat()

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

<style>
  .custom-scroll::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scroll::-webkit-scrollbar-thumb {
    background-color: var(--surface-500);
    border-radius: 4px;
  }

  .chat-message {
    font-size: 16px;
  }

  .chat-message .message-content {
    width: auto;
    overscroll-behavior: none;
    max-width: 100%;
    overflow: hidden;
    background-color: transparent;
  }

  .chat-message h3 {
    font-size: 1.17em !important;
    line-height: 1.75 !important;
    font-weight: 500 !important;
    margin-top: 1.25em !important;
    margin-bottom: 1.25em !important;
  }

  .chat-message div p:first-child {
    margin-top: 0 !important;
  }

  .chat-message p {
    tab-size: 4;
    font-feature-settings: normal;
    font-variation-settings: normal;
    box-sizing: border-box;
    color: var(--text-color) !important;
    margin-top: 1.25em !important;
    word-break: break-word;
  }

  .chat-message ul,
  .chat-message ol {
    tab-size: 4;
    font-feature-settings: normal;
    font-variation-settings: normal;
    font-size: 1rem;
    line-height: 1.75;
    border-width: 0;
    border-style: solid;
    border-color: var(--text-color);
    list-style: none;
    box-sizing: border-box;
    color: var(--text-color) !important;
    overscroll-behavior: contain !important;
    list-style-type: disc;
    margin-top: 1.25em;
    margin-bottom: 1.25em;
    padding-left: 1.625em;
  }

  .chat-message a {
    color: var(--text-color-link) !important;
    text-decoration: underline;
    font-weight: 500;
  }

  .chat-message pre {
    overflow: auto;
    display: block;
    word-break: break-all;
    overflow-wrap: break-word;
    border-radius: 7px;
    background: rgb(43, 43, 43);
    color: rgb(248, 248, 242);
    margin-top: 0.8em;
    margin-bottom: 0.8em;
    padding: 0.6em;
    font-size: 0.9em;
    line-height: 1.5em;
  }
</style>
