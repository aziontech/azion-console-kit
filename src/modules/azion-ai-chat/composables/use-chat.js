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
 * Creates a default configuration for the chat.
 * @param {Object} options - Initial chat settings.
 * @returns {Object} Reactive chat configuration.
 */
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

/**
 * Chat composable to manage messages and state, providing an interface for sending and receiving chat messages.
 * @param {Object} options - Initial configuration options with the following structure:
 *  - api: {Object} Contains API-related configurations.
 *    - url: {string} The base URL for the chat service.
 *    - stream: {boolean} Indicates if the chat should use streaming for responses.
 *  - user: {Object} Information about the user.
 *    - id: {string} A unique identifier for the user.
 *    - name: {string} The name of the user.
 *  - chat: {Object} Chat-specific configurations.
 *    - errorMessage: {string} Message to display when an error occurs.
 *    - suggestions: {Array} Initial suggestions to display to the user.
 *    - session: {string} A session identifier for the chat.
 *  - settings: {Object} Additional settings for the chat.
 *    - path: {string} The current path of the application, used for context.
 *    - app: {string} The name of the application using the chat.
 * @returns {Object} Chat methods and state, including sendMessage to send messages and state to access the current chat state.
 */
export function useChat(options = {}) {
  const config = createDefaultConfig(options)

  /**
   * Adds a new message to the state.
   * @param {string} role - The sender's role (e.g., 'user' or 'system').
   * @param {string} content - The message content.
   */
  const addMessage = (role, content, loading) => {
    state.messages.push({ role, content, loading })
    state.conversationStarted = true
  }

  /**
   * Handles error messages.
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

  const formatParsedBody = (config, messages) => {
    return {
      azion: {
        session_id: makeSessionId(),
        user_name: config.user.name,
        client_id: config.user.id,
        url: config.settings.path,
        app: config.settings.app
      },
      messages: [...messages],
      stream: config.api.stream
    }
  }

  /**
   * Sends a message and handles the service response.
   * @param {string} userMessage - Message sent by the user.
   */
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

  /**
   * Accumulates content in an existing system message or creates a new one.
   * @param {string} content - Content to be added to the message.
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
   * Clears the message history and resets the chat state.
   */
  const clearChat = () => {
    abortRequest()
    state.messages = []
    state.conversationStarted = false
    state.controller = null
    state.loading = false
  }

  /**
   * Aborts the current chat request.
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
