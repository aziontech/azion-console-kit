import { reactive, computed } from 'vue'
import { chatService } from '../services/chat-service.js'

const generateSessionId = () => crypto.randomUUID()

const state = reactive({
  config: {
    apiUrl: '/ai',
    userId: '',
    userName: '',
    errorMessage: 'Sorry, something went wrong.',
    stream: true
  },
  chat: {
    sessionId: generateSessionId(),
    suggestions: [],
    messages: []
  },
  isLoading: false,
  startConversation: false,
  controller: null
})

const initializeConfig = (config) => {
  state.config.apiUrl = config.apiUrl || state.config.apiUrl
  state.config.userId = config.userId || state.config.userId
  state.config.userName = config.userName || state.config.userName
  state.config.errorMessage = config.errorMessage || state.config.errorMessage
  state.config.stream = config.stream ?? state.config.stream
  state.chat.suggestions = config.suggestions || state.chat.suggestions
}

export function useChat(config) {
  if (config) {
    initializeConfig(config)
  }

  const setApiUrl = (url) => {
    state.config.apiUrl = url
  }

  const setUser = ({ userId, userName }) => {
    state.config.userId = userId
    state.config.userName = userName
  }

  const setStream = (enable) => {
    state.config.stream = !!enable
  }

  const setSuggestions = (suggestions) => {
    state.chat.suggestions = suggestions.map(({ icon, title, context }) => ({
      icon: icon || 'pi pi-question-circle',
      title,
      context
    }))
  }

  const setErrorMessage = (message) => {
    state.config.errorMessage = message
  }

  const addMessage = (role, content, status = false) => {
    const message = {
      id: generateSessionId(),
      role,
      content,
      timestamp: new Date().toISOString(),
      status
    }
    state.chat.messages.push(message)
    return message
  }

  const constructPayload = () => ({
    azion: {
      session_id: state.chat.sessionId,
      user_name: state.config.userName,
      client_id: state.config.userId,
      url: window.location.pathname,
      app: 'console'
    },
    messages: state.chat.messages.map(({ role, content }) => ({ role, content })),
    stream: state.config.stream
  })

  const sendMessage = async (content) => {
    if (state.isLoading) return

    state.isLoading = true
    addMessage('user', content)
    state.startConversation = true
    const parsedBody = constructPayload()

    const systemMessage = addMessage('system', '', true)

    try {
      state.controller = new AbortController()

      await chatService({
        parsedBody,
        server: state.config.apiUrl,
        signal: state.controller.signal,
        onMessage: (data, status) => {
          accumulateSystemMessage(data, status)
        }
      })

      systemMessage.status = false
    } catch (error) {
      handleError(error, systemMessage)
    } finally {
      state.isLoading = false
    }
  }

  const accumulateSystemMessage = (content, status = true) => {
    if (state.chat.messages.length > 0) {
      const lastMessageIndex = state.chat.messages.length - 1
      state.chat.messages[lastMessageIndex].content += content
      state.chat.messages[lastMessageIndex].status = status
    }
  }

  const handleError = (error, message) => {
    if (error.name === 'AbortError') {
      state.chat.messages.pop()
    } else {
      message.content = state.config.errorMessage
      message.status = false
    }
  }

  const clearChat = () => {
    abortRequest()
    state.chat.sessionId = generateSessionId()
    state.isLoading = false
    state.startConversation = false
    state.chat.messages = []
  }

  const abortRequest = () => {
    if (state.controller) {
      state.controller.abort()
      state.controller = null
    }
  }

  return {
    messages: computed(() => state.chat.messages),
    isLoading: computed(() => state.isLoading),
    suggestions: computed(() => state.chat.suggestions),
    getStartConversation: computed(() => state.startConversation),
    sendMessage,
    clearChat,
    setSuggestions,
    setApiUrl,
    setUser,
    setStream,
    abortRequest,
    setErrorMessage
  }
}
