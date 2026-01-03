/**
 * Shared Toast Selectors
 *
 * Selectors for toast notifications.
 */

export default {
  // Toast container
  container: '.p-toast',

  // Toast by message content
  byMessage: (message) => `[data-testid="toast-block__content__${message}"]`,

  // Toast with link/action
  withAction: (message) => `[data-testid="toast-block__content__${message}__link"]`,

  // Close button
  closeButton: '.p-toast-icon-close',

  // Toast severity classes
  success: '.p-toast-message-success',
  error: '.p-toast-message-error',
  warning: '.p-toast-message-warn',
  info: '.p-toast-message-info',

  // Toast content
  summary: '.p-toast-summary',
  detail: '.p-toast-detail',

  // Common toast messages (for reference)
  messages: {
    // Variables
    variableCreated: 'Your variable has been created',
    variableUpdated: 'Your variable has been updated',
    variableDeleted: 'Variable successfully deleted',

    // Edge Functions
    functionCreated: 'Your edge function has been created',
    functionUpdated: 'Your edge function has been updated',
    functionDeleted: 'Edge Function successfully deleted',

    // Generic
    copiedToClipboard: 'Successfully copied!',
    genericError: 'Error',
    genericSuccess: 'Success'
  }
}
