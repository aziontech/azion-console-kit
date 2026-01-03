/**
 * Shared Form Actions Selectors
 *
 * Common selectors for form action buttons (save, cancel, etc).
 */

export default {
  // Primary action buttons
  submitButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]',

  // Alternative patterns used in some forms
  saveButton: 'button[type="submit"]',
  createButton: (moduleName) => `[data-testid="create_${moduleName}_button"]`,

  // Page heading actions
  pageHeading: {
    title: (module) => `[data-testid="${module}__page-heading"]`,
    actions: '[data-testid="page-heading__actions"]'
  },

  // Form sections
  section: (sectionName) => `[data-testid*="form__section__${sectionName}"]`,

  // Common field patterns
  field: {
    input: (fieldName) => `[data-testid*="${fieldName}__input"], [data-testid*="${fieldName}-field__input"]`,
    dropdown: (fieldName) => `[data-testid*="${fieldName}__dropdown"], [data-testid*="${fieldName}-field__dropdown"]`,
    switch: (fieldName) => `[data-testid*="${fieldName}__switch"], [data-testid*="${fieldName}-field__switch"]`,
    textarea: (fieldName) => `[data-testid*="${fieldName}__textarea"], [data-testid*="${fieldName}-field__textarea"]`,
    error: (fieldName) => `[data-testid*="${fieldName}__error"]`,
    label: (fieldName) => `[data-testid*="${fieldName}__label"]`
  },

  // Dialog/Modal buttons
  dialog: {
    confirmButton: '[data-testid*="dialog__confirm-button"]',
    cancelButton: '[data-testid*="dialog__cancel-button"]',
    closeButton: '.p-dialog-header-close'
  },

  // Loading state
  loading: {
    spinner: '.p-progress-spinner',
    skeleton: '.p-skeleton',
    buttonLoading: '.p-button-loading'
  }
}
