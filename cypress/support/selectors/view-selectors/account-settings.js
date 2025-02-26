export default {
  accountName: '[data-testid="account-settings__account-name__input"]',
  companyName: '[data-testid="account-settings__company-name__input"]',
  companyId: '[data-testid="account-settings__company-id__input"]',
  billingEmails: '[data-testid="account-settings__billing-emails__textarea"]',
  postalCode: '[data-testid="account-settings__postal-code__input"]',
  country: '[data-testid="account-settings__country__dropdown"]',
  countryDropdown: '[data-testid="account-settings__country__dropdown"] > .p-dropdown-trigger',
  countryOption: (optionIdx) => `#country_${optionIdx}`,
  region: '[data-testid="account-settings__region__dropdown"]',
  regionDropdown: '[data-testid="account-settings__region__dropdown"] > .p-dropdown-trigger',
  regionOption: (optionIdx) => `#region_${optionIdx}`,
  city: '[data-testid="account-settings__city__dropdown"]',
  cityDropdown: '[data-testid="account-settings__city__dropdown"] > .p-dropdown-trigger',
  cityOption: (optionIdx) => `#city_${optionIdx}`,
  address: '[data-testid="account-settings__address__input"]',
  complement: '[data-testid="account-settings__complement__input"]',
  countryLoading: '[data-testid="account-settings__country__loading-icon"]',
  regionLoading: '[data-testid="account-settings__region__loading-icon"]',
  cityLoading: '[data-testid="account-settings__city__loading-icon"]',
  socialLogin:
    '[data-testid="account-settings__login-settings__switch-isSocialLoginEnabled__switch"] > .p-inputswitch-slider',
  enforceMfa:
    '[data-testid="account-settings__login-settings__switch-isEnabledMfaToAllUsers__switch"] > .p-inputswitch-slider',
  submitButton: '[data-testid="form-actions-submit-button"] > .p-button-label'
}
