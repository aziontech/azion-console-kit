import { reactive, computed } from 'vue'
import { knowledgeBaseService } from '@/services/v2/knowledge-base/knowledge-base-service'

const generateSessionId = () => crypto.randomUUID()

const state = reactive({
  config: {
    kbId: null,
    errorMessage: 'Sorry, something went wrong with your query.'
  },
  chat: {
    sessionId: generateSessionId(),
    suggestions: [
      {
        icon: 'pi pi-question-circle',
        title: 'What is this knowledge base about?',
        context: 'What is this knowledge base about?'
      },
      {
        icon: 'pi pi-list',
        title: 'Summarize the key topics',
        context: 'Summarize the key topics covered in this knowledge base'
      },
      {
        icon: 'pi pi-search',
        title: 'Search for specific information',
        context: 'Can you help me find information about...'
      }
    ],
    messages: [],
    contexts: []
  },
  isLoading: false,
  startConversation: false
})

const initializeConfig = (config) => {
  state.config.kbId = config.kbId ?? state.config.kbId
  state.config.errorMessage = config.errorMessage || state.config.errorMessage
  state.chat.suggestions = config.suggestions || state.chat.suggestions
}

export function useKnowledgeBaseChat(config) {
  if (config) {
    initializeConfig(config)
  }

  const setKbId = (kbId) => {
    state.config.kbId = kbId
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

  const addMessage = (role, content, status = false, context = null) => {
    const message = {
      id: generateSessionId(),
      role,
      content,
      timestamp: new Date().toISOString(),
      status,
      context
    }
    state.chat.messages.push(message)
    return message
  }

  const sendQuestion = async (question) => {
    if (state.isLoading || !state.config.kbId) return

    state.isLoading = true
    addMessage('user', question)
    state.startConversation = true

    const systemMessage = addMessage('system', '', true)

    try {
      const response = await knowledgeBaseService.askKnowledgeBase(
        state.config.kbId,
        question,
        5
      )

      // Update system message with the answer
      systemMessage.content = response.answer || 'No answer available.'
      systemMessage.context = response.context || []
      systemMessage.status = false

      // Store contexts for potential display
      if (response.context && response.context.length > 0) {
        state.chat.contexts.push({
          messageId: systemMessage.id,
          contexts: response.context
        })
      }
    } catch (error) {
      handleError(error, systemMessage)
    } finally {
      state.isLoading = false
    }
  }

  const handleError = (error, message) => {
    message.content = state.config.errorMessage
    message.status = false
    message.context = null
  }

  const clearChat = () => {
    state.chat.sessionId = generateSessionId()
    state.isLoading = false
    state.startConversation = false
    state.chat.messages = []
    state.chat.contexts = []
  }

  const getContextForMessage = (messageId) => {
    const contextEntry = state.chat.contexts.find((entry) => entry.messageId === messageId)
    return contextEntry?.contexts || []
  }

  return {
    messages: computed(() => state.chat.messages),
    isLoading: computed(() => state.isLoading),
    suggestions: computed(() => state.chat.suggestions),
    getStartConversation: computed(() => state.startConversation),
    sendQuestion,
    clearChat,
    setSuggestions,
    setKbId,
    setErrorMessage,
    getContextForMessage
  }
}

