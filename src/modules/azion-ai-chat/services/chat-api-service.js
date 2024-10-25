import axios from 'axios'
import { requestInterceptorService } from './interceptor-request'
import { responseInterceptorService } from './interceptor-response'

const environment = process.env.VUE_APP_ENVIRONMENT

const DEEP_CHAT_CONFIG_REQUEST = {
  url: `https://${
    environment === 'production' ? '' : 'stage-'
  }ai.azion.com/copilot/chat/completions`
}

/**
 * Chat service for handling API calls to the chat service.
 */
export const chatService = {
  /**
   * Sends a message to the chat API and returns the response.
   *
   * @param {Object} params - Parameters for the API call.
   * @param {string} params.sessionId - The session ID.
   * @param {string} params.url - The URL.
   * @param {string} params.userName - The user name.
   * @param {string} params.clientId - The client ID.
   * @param {Array} params.allMessage - The array of messages to send.
   * @param {Object} params.prompt - The prompt details.
   * @returns {Promise<Object>} The response from the chat API.
   * @throws {Error} If the API call fails.
   */
  async sendMessage({ sessionId, url, userName, clientId, allMessage, prompt }) {
    const requestDetails = {
      body: {} // Inicializa o corpo da requisição
    }

    // Aplica o interceptor de requisição
    const modifiedRequestDetails = requestInterceptorService(requestDetails, {
      sessionId,
      url,
      userName,
      clientId,
      allMessage,
      prompt
    })

    try {
      const response = await axios.post(DEEP_CHAT_CONFIG_REQUEST.url, modifiedRequestDetails.body, {
        headers: {
          Authorization: `Bearer ${process.env.VUE_APP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      // Aplica o interceptor de resposta
      return responseInterceptorService(response.data)
    } catch (err) {
      throw new Error('Erro ao obter a resposta: ' + err.message)
    }
  }
}
