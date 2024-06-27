import { makeAskAzionBaseUrl } from './makeAskAzionBaseUrl'
/**
 * Generates a request configuration object with the provided sessionId and currentUrl.
 *
 * @param {string} sessionId - The session ID for the request.
 * @param {string} url - The current path where user sent the AI request.
 * @return {Object} The request configuration object.
 */
export const makeRequestConfig = () => {
  return {
    url: `${makeAskAzionBaseUrl()}/chat-stream`
  }
}
