export default {
  // Header / create modal
  navbarCreateButton: '[data-testid="navbar__create-button"]',
  modalContainer: '[data-testid="integrations-list-container"]',
  modalMenuItem: '[data-testid="integrations-list-menu-item"]',
  modalTemplatesItem: '[data-testid="integrations-list-content-templates-item"]',
  modalRecommendedItem: '[data-testid="integrations-list-content-recommended-item"]',
  modalSearch: '[data-testid="integrations-list-content-search"]',

  // Repository step inputs
  gitScopeDropdown: '[data-testid="template-engine__git-scope-dropdown"]',
  dropdownItem: '.p-dropdown-item',
  projectNameInput: '[data-testid="field-text-privacy__input"]',
  privacySwitch: '[data-testid="field-text-privacy__privacy-switch"]',
  projectNameLabel: '[data-testid="field-text-privacy__label"]',
  projectNameError: '[data-testid="field-text-privacy__error-message"]',
  // Settings step (password field rendered via JsonForms)
  settingsPasswordInput: '[data-testid="field-password__input"] input',

  // Footer / settings actions
  nextButton: '[data-testid="template-engine__next-button"]',
  deployButton: '[data-testid="template-engine__deploy-button"]',
  settingsDeployButton: '[data-testid="template-engine__settings-deploy-button"]',

  // Cards
  inputsCard: '[data-testid="template-engine__inputs-card"]',
  deployStatusCard: '[data-testid="deploy-status-card"]',
  deploySuccessCard: '[data-testid="deploy-success-card"]',
  deploySuccessUrl: '[data-testid="deploy-success-card__app-url"]',
  deploySuccessResourceLink: '[data-testid="deploy-success-card__resource-link"]',
  deploySuccessNextStepLink: '[data-testid="deploy-success-card__next-step-link"]'
}
