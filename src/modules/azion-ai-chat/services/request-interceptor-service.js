/**
 * Intercepts the request details and adds sessionId, url, userName, and app to the request body.
 *
 * @param {Object} requestDetails - The details of the request.
 * @param {string} requestDetails.sessionId - The session ID.
 * @param {string} requestDetails.url - The URL.
 * @param {string} requestDetails.userName - The user name.
 * @param {string} requestDetails.clientId - The client ID.
 * @param {Array} requestDetails.allMessage - The array of messages.
 * @param {string} requestDetails.prompt - The prompt that determines the origin of the chat call.
 * @return {Object} The modified request details with added properties.
 */
export const requestInterceptorService = (
  requestDetails,
  { sessionId, url, userName, clientId, allMessage, prompt }
) => {
  const APP_PLATFORM_NAME = 'console'

  if (!requestDetails?.body) {
    return
  }

  const messages = allMessage.map(({ role, text }) => ({
    role: role === 'user' ? 'user' : 'system',
    content: text
  }))

  const azionAiChat = {
    session_id: sessionId,
    user_name: userName,
    client_id: clientId,
    url,
    app: APP_PLATFORM_NAME,
    ...(prompt && {
      user_prompt: prompt.user_prompt,
      system_prompt: prompt.system_prompt
    })
  }

  requestDetails.body = {
    ...requestDetails.body,
    messages,
    stream: true,
    azion: azionAiChat
  }

  return requestDetails
}
