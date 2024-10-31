import { reactive, computed, readonly } from 'vue'
import { chatService } from '../services/chat-service.js'
import { makeBaseUrl } from '../services/make-url.js'
import { makeSessionId } from '../services/make-session-id.js'
import { useRouter } from 'vue-router'

const state = reactive({
  messages: [],
  conversationStarted: false,
  loading: false,
  controller: null
})

/**
 * Cria uma configuração padrão para o chat.
 * @param {Object} options - Configurações iniciais do chat.
 * @returns {Object} Configuração reativa do chat.
 */
function createDefaultConfig({ api = {}, user = {}, chat = {}, settings = {} }) {
  const { currentRoute } = useRouter()

  return reactive({
    api: {
      url: api.url || makeBaseUrl(),
      stream: api.stream !== undefined ? api.stream : true
    },
    user: {
      id: user.id || '',
      name: user.name || ''
    },
    chat: {
      errorMessage: chat.errorMessage || 'Sorry, something went wrong.',
      suggestions: chat.suggestions || [],
      session: chat.session || makeSessionId()
    },
    settings: {
      path: settings.url || currentRoute.value.path,
      app: settings.app || 'console'
    }
  })
}

/**
 * Composable de chat para gerenciar mensagens e estado.
 * @param {Object} options - Opções de configuração inicial.
 * @returns {Object} Métodos e estado do chat.
 */
export function useChat(options = {}) {
  const config = createDefaultConfig(options)

  /**
   * Adiciona uma nova mensagem ao estado.
   * @param {string} role - O papel do remetente (ex. 'user' ou 'system').
   * @param {string} content - O conteúdo da mensagem.
   */
  const addMessage = (role, content) => {
    state.messages.push({ role, content })
    state.conversationStarted = true
  }

  /**
   * Lida com mensagens de erro.
   */
  const handleError = ({ name }) => {
    if (name === 'AbortError') {
      const lastMessage = state.messages[state.messages.length - 1]
      if (lastMessage && lastMessage.role !== 'user' && !lastMessage.content) {
        state.messages.pop()
      }
    } else {
      addMessage('system', config.chat.errorMessage)
    }
  }

  /**
   * Envia uma mensagem e lida com a resposta do serviço.
   * @param {string} userMessage - Mensagem enviada pelo usuário.
   */
  const sendMessage = async (userMessage) => {
    if (state.loading) return

    state.loading = true
    addMessage('user', userMessage)

    const parsedBody = {
      messages: [...state.messages],
      stream: config.api.stream
    }

    addMessage('system', '')

    try {
      state.controller = new AbortController()
      await chatService({
        parsedBody,
        server: config.api.url,
        signal: state.controller.signal,
        onMessage: accumulateSystemMessage
      })
    } catch (error) {
      handleError(error)
    } finally {
      state.loading = false
    }
  }

  /**
   * Acumula conteúdo em uma mensagem de sistema existente ou cria uma nova.
   * @param {string} content - Conteúdo a ser adicionado à mensagem.
   */
  const accumulateSystemMessage = (content) => {
    const lastMessage = state.messages[state.messages.length - 1]
    if (lastMessage && lastMessage.role === 'system') {
      lastMessage.content += content
    } else {
      state.messages.push({ role: 'system', content })
    }
  }

  /**
   * Limpa o histórico de mensagens e reinicia o estado do chat.
   */
  const clearChat = () => {
    abortRequest()
    state.messages = []
    state.conversationStarted = false
    state.controller = null
    state.loading = false
  }

  /**
   * Aborta a requisição atual do chat.
   */
  const abortRequest = () => {
    if (state.controller) {
      state.controller.abort()
      state.controller = null
    }
  }

  const getAllMessages = computed(() => state.messages)
  const isResponding = computed(() => state.loading)

  return {
    isResponding,
    state: readonly(state),
    getAllMessages,
    chatConfig: readonly(config),
    sendMessage,
    clearChat,
    abortRequest
  }
}
