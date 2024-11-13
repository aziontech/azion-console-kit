<template>
  <div
    class="custom-scroll flex-1 flex-col max-h-[calc(100vh-15.5rem)] overflow-x-hidden pb-8 px-8"
  >
    <div class="h-full rounded-md border surface-border">
      <div class="flex flex-1 flex-col h-full">
        <div class="flex w-full flex-1 overflow-x-hidden custom-scroll">
          <div
            class="self-stretch py-3 flex-col justify-start items-center gap-10 flex"
            v-if="!getStartConversation"
            :class="{ 'justify-center': !getStartConversation }"
          >
            <Welcome />

            <div class="w-[548px] justify-center items-start gap-3 inline-flex">
              <Suggestions />
            </div>

            <slot name="chatSuggestions" />
          </div>
          <div
            class="h-fit"
            v-else
          >
            <div class="flex justify-end p-3 sticky top-0 surface-section">
              <PrimeButton
                icon="pi pi-eraser"
                outlined
                label="Clear chat"
                class="surface-border"
                aria-label="Clear chat"
                v-tooltip.bottom="'Clear chat'"
                @click="clearChat"
              />
            </div>
            <ChatMessages class="w-full pb-3" />
          </div>
        </div>
        <div class="self-stretch flex-col justify-start items-center gap-4 flex">
          <ChatInput class="w-full pb-3" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import Welcome from '../components/chat-welcome.vue'
  import ChatInput from '../components/chat-input.vue'
  import ChatMessages from '../components/chat-list-messages.vue'
  import Suggestions from '../components/chat-suggestions.vue'
  import { useChat } from '../composables/use-chat.js'
  import { nextTick, ref, watch } from 'vue'

  defineOptions({
    name: 'AzionAiChatLayout'
  })

  const props = defineProps({
    user: Object,
    suggestionsOptions: Array
  })

  const { messages, getStartConversation, clearChat } = useChat({
    ...props.user,
    suggestions: props.suggestionsOptions
  })

  const chatContainer = ref(null)

  const scrollToBottom = () => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }

  watch(
    () => messages,
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

  .chat-message div d:first-child {
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
