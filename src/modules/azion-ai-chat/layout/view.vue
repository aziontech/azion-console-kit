<template>
  <div class="min-h-[calc(100vh-15.5rem)] max-h-[calc(100vh-15.5rem)] pb-8 px-8 h-full">
    <div class="flex flex-col border h-full rounded-md surface-border p-3">
      <div
        class="overflow-hidden overflow-y-auto h-full custom-scroll"
        ref="chatContainer"
      >
        <template v-if="!getStartConversation">
          <div class="flex flex-col gap-6 h-full justify-center">
            <Welcome />
            <Suggestions />
            <slot name="chatSuggestions" />
          </div>
        </template>
        <template v-else>
          <div class="h-full px-3">
            <div class="sticky w-full flex justify-end px-3 top-0 surface-section">
              <PrimeButton
                icon="pi pi-eraser"
                outlined
                label="New chat"
                class="surface-border"
                aria-label="New chat"
                v-tooltip.bottom="'New chat'"
                @click="clearChat"
              />
            </div>
            <ChatMessages class="pb-6" />
          </div>
        </template>
      </div>
      <ChatInput />
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
    user: props.user,
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
</style>
