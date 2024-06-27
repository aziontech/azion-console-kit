import { makeAskAzionBaseUrl } from './makeAskAzionBaseUrl'
/**
 * Generates a request configuration object for the Ask Azion API.
 */
export const makeRequestConfig = () => {
  return {
    url: `${makeAskAzionBaseUrl()}/chat-stream`
  }
}
