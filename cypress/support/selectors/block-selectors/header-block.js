export default {
  buttonFeedback: {
    openFeedback: '[data-testid="header-block__open-feedback-button"]',
    typeDropdown: '[data-testid="feedback-dialog__dialog-body__button-type-dropdown"]',
    typeDropdownOption: (option) => `li[aria-label="${option}"].p-dropdown-item`,
    description: '[data-testid="feedback-dialog__dialog-body__textarea-description"]',
    closeFeedback: '[data-testid="feedback-dialog__dialog-footer__cancel-button"]',
    submitFeedback: '[data-testid="feedback-dialog__dialog-footer__confirm-button"]'
  }
}
