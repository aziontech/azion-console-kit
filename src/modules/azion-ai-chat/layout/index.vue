<template>
  <Toolbar class="border-noround border-x-none w-full pl-6 pr-8 py-3 z-10 border-top-none">
    <template #start>
      <h3 class="text-color text-lg font-medium flex gap-3">
        Azion Copilot
        <PrimeTag
          v-tooltip.bottom="tooltipMessage"
          value="Preview"
        />
      </h3>
    </template>
    <template #end>
      <slot
        name="chatControls"
        :clearChat="clearChat"
      />
    </template>
  </Toolbar>
  <div
    class="flex flex-auto flex-col overflow-x-hidden p-6 pt-3 custom-scroll"
    :class="{ 'justify-center gap-6': !getStartConversation }"
    ref="chatContainer"
  >
    <div
      class="self-stretch py-3 flex-col justify-start items-center gap-10 flex"
      v-if="!getStartConversation"
      :class="{ 'justify-center': !getStartConversation }"
    >
      <Welcome />

      <div class="justify-center items-start gap-3 inline-flex">
        <Suggestions />
      </div>

      <slot name="chatSuggestions" />
    </div>
    <div
      class="h-full px-3"
      v-else
    >
      <ChatMessages />
    </div>
  </div>

  <ChatInput class="p-6" />
</template>

<script setup>
  import PrimeTag from 'primevue/tag'
  import Toolbar from 'primevue/toolbar'
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
    suggestionsOptions: Array,
    invokeClearChat: Boolean
  })

  const tooltipMessage =
    'Copilot is in preview mode and can make mistakes. Consider verifying important information.'

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

  watch(
    () => props.invokeClearChat,
    (newValue) => {
      if (newValue) {
        clearChat()
      }
    },
    { immediate: true }
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
