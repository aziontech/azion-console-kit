// src/composables/use-chat.js
import { reactive, computed, readonly } from 'vue'
import { chatService } from '../services/chat-service.js'

export function useChat(initialConfig = {}) {
  const state = reactive({
    messages: [],
    conversationStarted: false,
    controller: null
  })

  const config = reactive({
    server: initialConfig.server || 'https://ai.azion.com/copilot/chat/completions',
    accessToken: initialConfig.accessToken || 'defaultToken',
    session_id: initialConfig.session_id || '740c3449-d568-4426-a55e-e4c0f1d604bd',
    user_name: initialConfig.user_name || 'User',
    client_id: initialConfig.client_id || '',
    url: initialConfig.url || '/',
    stream: initialConfig.stream || true,
    app: initialConfig.app || 'console',
    welcome: initialConfig.welcome || 'Welcome to Azion Chat!',
    errorMessage: initialConfig.errorMessage || 'Sorry, something went wrong.',
    suggestions: initialConfig.suggestions || []
  })

  const addMessage = (role, content) => {
    state.messages.push({ role, content })
    state.conversationStarted = true
  }

  const accumulateSystemMessage = (content) => {
    const lastMessage = state.messages[state.messages.length - 1]

    if (lastMessage && lastMessage.role === 'system') {
      lastMessage.content += content
    } else {
      state.messages.push({ role: 'system', content })
    }
  }

  const sendMessage = async (userMessage) => {
    addMessage('user', userMessage)

    let parsedBody = {
      messages: [{ role: 'user', content: userMessage }],
      stream: config.stream
    }

    try {
      state.controller = new AbortController()

      const response = await chatService({
        parsedBody,
        server: config.server,
        signal: state.controller.signal
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        const parsedLines = lines
          .map((line) => line.replace(/^data: /, '').trim()) // Remove the "data: " prefix
          .filter((line) => line !== '' && line !== '[DONE]') // Remove empty lines and "[DONE]"
          .map((line) => JSON.parse(line)) // Parse the JSON string

        for (const parsedLine of parsedLines) {
          const { choices } = parsedLine
          const { delta } = choices[0]
          const { content } = delta
          // Update the UI with the new content
          if (content) {
            accumulateSystemMessage(content)
          }
        }
      }
    } catch (error) {
      addMessage('system', config.errorMessage)
    }
  }

  const resetChat = () => {
    state.messages = []
    state.conversationStarted = false
  }

  const setSessionId = (sessionId) => {
    config.session_id = sessionId
  }

  const setUser = (user) => {
    config.user_name = user.name
    config.client_id = user.id
  }

  const setErrorMessage = (errorMessage) => {
    config.errorMessage = errorMessage
  }

  const abortRequest = () => {
    if (state.controller) {
      state.controller.abort()
      state.controller = null
    }
  }

  const getAllMessages = computed(() => state.messages)

  return {
    state: readonly(state),
    getAllMessages,
    chatConfig: readonly(config),
    sendMessage,
    resetChat,
    abortRequest,
    setSessionId,
    setUser,
    setErrorMessage
  }
}
