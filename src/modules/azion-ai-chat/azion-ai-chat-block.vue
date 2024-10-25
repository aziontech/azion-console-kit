<template>
  <div class="flex flex-col w-full h-full px-6 pt-5">
    <div class="flex-auto overflow-y-auto">
      <div>
        <p v-if="loading">Gerando resposta...</p>
        <p v-if="error">Erro: {{ error }}</p>
        <div
          v-if="displayedContent"
          v-html="displayedContent"
        ></div>
        <!-- Exibe o conteúdo HTML -->
      </div>
    </div>
    <div class="flex flex-col gap-4 mt-1.5 mb-6">
      <button
        @click="startChat"
        :disabled="loading"
      >
        Gerar
      </button>
      <button
        @click="stopChat"
        :disabled="!loading"
      >
        Parar
      </button>
      <small class="text-xs text-color-secondary font-normal leading-5 text-center mb-2 mx-2">
        Azion Copilot may make mistakes. Consider verifying important information.
      </small>
    </div>
  </div>
</template>

<script setup>
  import { useChatAPI } from './composables/use-chat-copilot.js'
  import { ref } from 'vue'

  defineOptions({
    name: 'azion-ai-chat-block'
  })

  const prompt = ref('Gere um lorem com 10 linhas')
  const { responseContent, loading, error, generateChatResponse, stopChatResponse } = useChatAPI(
    'https://api.openai.com/v1/chat/completions'
  )

  const displayedContent = ref('')

  const startChat = () => {
    if (!prompt.value.trim()) {
      error.value = 'Por favor, insira um prompt.'
      return
    }

    // Limpa mensagens anteriores e erro
    displayedContent.value = ''
    error.value = ''

    const messages = [{ role: 'user', content: prompt.value }]
    generateChatResponse(messages).then(() => {
      typeOutResponse(responseContent.value) // Inicia o efeito de digitação
    })
  }

  const stopChat = () => {
    stopChatResponse()
  }

  const typeOutResponse = (text, delay) => {
    displayedContent.value = ''
    let index = 0

    const typeNextCharacter = () => {
      if (index < text.length) {
        displayedContent.value += text[index]
        index++

        // Define o tempo de espera baseado na natureza do caractere
        const additionalDelay = /[.!?]/.test(text[index - 1]) ? 300 : 0 // Pausa maior após pontuação
        setTimeout(typeNextCharacter, delay + additionalDelay)
      }
    }

    typeNextCharacter()
  }
</script>

<style scoped>
  .custom-scroll::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scroll::-webkit-scrollbar-thumb {
    background-color: var(--surface-section);
    border-radius: 4px;
  }
</style>
