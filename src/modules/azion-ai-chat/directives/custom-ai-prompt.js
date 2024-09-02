const TARGET_ORIGIN = window.location.origin
export const AZION_MESSAGE_TYPE = 'azion-ai'

/**
 * Sends a message to the Copilot.
 *
 * @return {void} No return value.
 */
const sendMessageToAzionAI = (contextualPrompt) => {
  window.postMessage({ type: AZION_MESSAGE_TYPE, prompt: contextualPrompt }, TARGET_ORIGIN)
}

/**
 * @typedef {import('vue').DirectiveOptions} DirectiveOptions
 */

/**
 * @type {DirectiveOptions}
 * @example <p v-prompt="'Hi, I want to create a custom domain'">Get Copilot Help here</p>
 */
export const customAiPrompt = {
  /**
   * Called before bound element's attributes or event listeners are applied.
   * @param {Element} el - The element the directive is bound to.
   * @param {import('vue').DirectiveBinding} binding - The binding object containing the directive's value, oldValue, expression, arg, and modifiers.
   */
  created(el, binding) {
    el.addEventListener('click', () => sendMessageToAzionAI(binding.value))
  },
  /**
   * Called when the parent component is unmounted.
   * @param {Element} el - The element the directive is bound to.
   * @param {import('vue').DirectiveBinding} binding - The binding object containing the directive's value, oldValue, expression, arg, and modifiers.
   */
  unmounted(el, binding) {
    el.removeEventListener('click', () => sendMessageToAzionAI(binding.value))
  }
}
