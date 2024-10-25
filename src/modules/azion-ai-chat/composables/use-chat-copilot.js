import { ref } from 'vue'
import { ChatAPIService } from './apiService'

export function useChatAPI(apiUrl, apiKey) {
  const chatService = new ChatAPIService(apiUrl, apiKey)
  const responseContent = ref('')
  const loading = ref(false)
  const error = ref(null)

  const generateChatResponse = async (messages) => {
    loading.value = true
    error.value = null

    try {
      const result = await chatService.generateResponse(messages)
      responseContent.value = result
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const stopChatResponse = () => {
    chatService.cancelRequest()
    loading.value = false
  }

  return {
    responseContent,
    loading,
    error,
    generateChatResponse,
    stopChatResponse
  }
}
