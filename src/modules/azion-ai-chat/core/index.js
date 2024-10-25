// core/index.js

/**
 * Core module that provides various utility functions for the application.
 */

/**
 * Validates the messages to ensure they are in the correct format.
 *
 * @param {Array} messages - The array of messages to validate.
 * @returns {boolean} True if messages are valid, false otherwise.
 */
export const validateMessages = (messages) => {
  return messages && Array.isArray(messages) && messages.length > 0
}

//  - components
//      - input-send.vue
//      - messages.vue
//      - messages-list.vue
//      - messages-list-item.vue
//  - composables
//      - use-chat-copilot.js
//  - directives
//      - index.js
//  - layout
//      - index.vue
//  - services
//      - index
//      - interceptor-response
//      - interceptor-request
//      - parser-payload
//  - tests
//      - unit
//          - services
//          - interceptor-response.spec.js
//          - interceptor-request.spec.js
//          - parser-payload.spec.js
//  - core
//      - index.js
//          -- construct
//          -- validacoes
//          -- regras
//          -- e outros pontos que achar necessarios