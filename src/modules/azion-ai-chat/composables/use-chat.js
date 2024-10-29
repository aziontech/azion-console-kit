import { reactive, computed, readonly } from 'vue'
import { chatService } from '../services/chat-service.js'
import { makeBaseUrl } from '../services/make-url.js'
import { makeSessionId } from '../services/make-session-id.js'
import { useRouter } from 'vue-router'

export function useChat({ api = {}, user = {}, chat = {}, settings = {} } = {}) {
  const { currentRoute } = useRouter()

  const state = reactive({
    messages: [],
    conversationStarted: false,
    controller: null
  })

  const config = reactive({
    api: {
      url: api.url || makeBaseUrl(),
      stream: api.stream || true
    },
    user: {
      id: user.id || '',
      name: user.name || ''
    },
    chat: {
      // welcome: chat.welcome || 'Welcome to Azion Chat!',
      errorMessage: chat.errorMessage || 'Sorry, something went wrong.',
      suggestions: chat.suggestions || [],
      session: chat.session || makeSessionId()
    },
    settings: {
      path: settings.url || currentRoute.value.path,
      app: settings.app || 'console'
    }
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
      messages: state.messages,
      stream: config.api.stream
    }

    try {
      state.controller = new AbortController()

      const response = await chatService({
        parsedBody,
        server: config.api.url,
        signal: state.controller.signal
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')

      let reading = true
      while (reading) {
        const { done, value } = await reader.read()

        reading = !done

        if (!reading) break

        const chunk = decoder.decode(value)
        chunk
          .split('\n')
          .map((line) => line.replace(/^data: /, '').trim())
          .filter((line) => line && line !== '[DONE]')
          .map(JSON.parse)
          .forEach(({ choices }) => {
            const content = choices[0]?.delta?.content
            if (content) accumulateSystemMessage(content)
          })
      }
    } catch (error) {
      addMessage('system', config.chat.errorMessage)
    }
  }

  const clearChat = () => {
    state.messages = []
    state.conversationStarted = false
    state.controller = null
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
    clearChat,
    abortRequest
  }
}
