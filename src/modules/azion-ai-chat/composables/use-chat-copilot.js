import { ref } from 'vue'
import { chatService } from '../services/chat-api-service.js'

/**
 * Composable for managing chat API interactions.
 *
 * @param {string} sessionId - The session ID.
 * @param {string} url - The URL.
 * @param {string} userName - The user name.
 * @param {string} clientId - The client ID.
 * @param {Array} allMessage - The array of messages to send.
 * @param {Object} prompt - The prompt details.
 * @returns {Object} The response content, loading state, error state, and function to generate a chat response.
 */
export const useChatAPI = (sessionId, url, userName, clientId, allMessage, prompt) => {
  const responseContent = ref('')
  const loading = ref(false)
  const error = ref(null)

  /**
   * Generates a chat response by sending a message to the API.
   */
  const generateChatResponse = async () => {
    loading.value = true
    error.value = null

    try {

      // Chama o serviço para enviar a mensagem
      responseContent.value = await chatService.sendMessage({
        sessionId,
        url,
        userName,
        clientId,
        allMessage,
        prompt
      })
    } catch (err) {
      error.value = err.message // A mensagem de erro agora é a mensagem do erro capturado
    } finally {
      loading.value = false
    }
  }

  return { responseContent, loading, error, generateChatResponse }
}
