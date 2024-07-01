import { makeAzionAiBaseUrl } from './make-azion-ai-base-url'
/**
 * Generates a request configuration object for the Ask Azion API.
 */
export const makeRequestConfig = () => {
  return {
    url: `${makeAzionAiBaseUrl()}/chat-stream`
  }
}
