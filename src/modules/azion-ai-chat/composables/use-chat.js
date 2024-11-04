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

function createDefaultConfig({ api = {}, user = {}, chat = {}, settings = {} }) {
  const { currentRoute } = useRouter()

  return reactive({
    api: {
      url: api.url || makeBaseUrl(),
      stream: api.stream || true
    },
    user: {
      id: user.id || '',
      name: user.name || ''
    },
    chat: {
      errorMessage: chat.errorMessage || 'Sorry, something went wrong.',
      suggestions: chat.suggestions || []
    },
    settings: {
      path: settings.url || currentRoute.value.path,
      app: settings.app || 'console'
    }
  })
}

export function useChat(options = {}) {
  const config = createDefaultConfig(options)

  const addMessage = (role, content, isInProgress) => {
    state.messages.push({ role, content, isInProgress })
    state.conversationStarted = true
  }

  const handleError = ({ name }) => {
    const lastMessage = state.messages[state.messages.length - 1]
    if (name === 'AbortError') {
      if (lastMessage && !lastMessage.content) {
        state.messages.pop()
      }
    } else {
      lastMessage.content = config.chat.errorMessage
      lastMessage.isInProgress = false
    }
  }

  const formatParsedBody = (config, messages) => {
    const formatMessages = messages.map(({ role, content }) => ({ role, content }))

    return {
      azion: {
        session_id: makeSessionId(),
        user_name: config.user.name,
        client_id: config.user.id,
        url: config.settings.path,
        app: config.settings.app
      },
      messages: [...formatMessages],
      stream: config.api.stream
    }
  }

  const sendMessage = async (userMessage) => {
    if (state.loading) return

    state.loading = true
    addMessage('user', userMessage)

    const parsedBody = formatParsedBody(config, [...state.messages])

    addMessage('system', '', true)

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

  const accumulateSystemMessage = (content, status = true) => {
    if (state.messages.length > 0) {
      const lastMessageIndex = state.messages.length - 1
      state.messages[lastMessageIndex].content += content
      state.messages[lastMessageIndex].isInProgress = status
    }
  }

  const clearChat = () => {
    abortRequest()
    state.messages = []
    state.conversationStarted = false
    state.controller = null
    state.loading = false
  }

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
