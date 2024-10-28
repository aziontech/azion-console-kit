<template>
  <!-- <Logo />

    <slot name="welcome" v-if="!conversationStarted">
      <Welcome />
    </slot> -->

  <slot
    name="suggestions"
    v-if="!conversationStarted"
  >
    <Suggestions
      :suggestions="chatConfig.suggestions"
      @suggest="sendMessage"
    />
  </slot>
  <!-- Exibe a área de mensagens após o usuário enviar a primeira mensagem -->
  <ChatMessages
    v-else
    :messages="state.messages"
  />

  <!-- Área de entrada de mensagem -->
  <ChatInput @sendMessage="sendMessageChat" />
</template>

<script setup>
  import ChatInput from '../components/message-input.vue'
  import ChatMessages from '../components/chat-messages.vue'
  // import Logo from '../components/logo.vue';
  // import Welcome from '../components/welcome.vue';
  import Suggestions from '../components/suggestions.vue'
  import { useChat } from '../composables/use-chat.js'

  defineOptions({
    name: 'AzionAiChatLayout'
  })

  const { sendMessage, state, chatConfig } = useChat()

  const sendMessageChat = (content) => {
    sendMessage(content)
  }
</script>
