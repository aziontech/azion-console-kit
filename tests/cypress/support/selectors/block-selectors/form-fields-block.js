export default {
  // Action bar (form save/cancel)
  actionsContainer: '[data-testid="form-actions-container"]',
  actionsContent: '[data-testid="form-actions-content"]',
  actionsButtons: '[data-testid="form-actions-buttons"]',
  actionsSubmitButton: '[data-testid="form-actions-submit-button"]',
  actionsCancelButton: '[data-testid="form-actions-cancel-button"]',
  actionsSkipButton: '[data-testid="form-actions-skipt-and-finish-button"]',
  actionsFinishButton: '[data-testid="form-actions-skipt-and-finish-button"]',
  submitButton: '[data-testid="form-actions-submit-button"]',

  // Go back / page title
  goBackButton: '[data-testid="action-bar__go-back"]',
  editPageTitle: (title) => `[data-testid="page_title_${title}"]`,

  // Unsaved changes dialog
  leavePageButton: '[data-testid="dialog-unsaved__leave-page"]',

  // Copy token/key dialog
  copyDialog: {
    header: '[data-testid="copy-token-dialog__header"]',
    warningMessage: '[data-testid="copy-token-dialog__warning__inline-message"]',
    tokenLabel: '[data-testid="copy-token-dialog__token-field__label"]',
    tokenPasswordInput: '[data-testid="copy-token-dialog__token-field__password-input"]',
    tokenTextInput: '[data-testid="copy-token-dialog__token-field__input-text"]',
    tokenDescription: '[data-testid="copy-token-dialog__token-field__description"]',
    copyButton: '[data-testid="copy-token-dialog__token-field__copy-token-button"]',
    confirmButton: '[data-testid="copy-token-dialog__dialog-footer__confirm-button"]'
  },

  // Webkit field helpers - build selectors for field sub-elements
  field: {
    input: (testId) => `[data-testid="${testId}__input"]`,
    dropdown: (testId) => `[data-testid="${testId}__dropdown"]`,
    dropdownFilter: (testId) => `[data-testid="${testId}__dropdown-filter-input"]`,
    multiselect: (testId) => `[data-testid="${testId}__multiselect"]`,
    errorMessage: (testId) => `[data-testid="${testId}__error-message"]`,
    switchInput: (testId) => `[data-testid="${testId}__switch"]`,
    label: (testId) => `[data-testid="${testId}__label"]`,
    description: (testId) => `[data-testid="${testId}__description"]`
  }
}
