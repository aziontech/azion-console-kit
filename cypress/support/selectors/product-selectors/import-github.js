export default {
  // Settings step (Import from Git form)
  gitScopeDropdown: '[data-testid="import-github__git-scope-dropdown"]',
  repositoryDropdown: '[data-testid="import-github__repository-dropdown"]',
  frameworkDropdown: '[data-testid="import-github__framework-dropdown"]',
  applicationNameInput: '[data-testid="import-github__application-name__input"]',
  applicationNameError: '[data-testid="import-github__application-name__error-message"]',
  rootDirectoryInput: '[data-testid="import-github__root-directory__input"]',
  rootDirectoryError: '[data-testid="import-github__root-directory__error-message"]',
  deployButton: '[data-testid="import-github__deploy-button"]',
  dropdownItem: '.p-dropdown-item',

  // Cards
  deployStatusCard: '[data-testid="deploy-status-card"]',
  deployRetryButton: '[data-testid="deploy-status-card__retry-button"]',
  deployNewButton: '[data-testid="deploy-status-card__new-deploy-button"]',
  deploySuccessCard: '[data-testid="deploy-success-card"]',
  deploySuccessUrl: '[data-testid="deploy-success-card__app-url"]',
  deploySuccessResourceLink: '[data-testid="deploy-success-card__resource-link"]'
}
