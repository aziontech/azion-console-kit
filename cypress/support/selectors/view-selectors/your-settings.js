export default {
  emailInput: '[data-testid="your-settings-form__email__input"]',
  emailError: '[data-testid="your-settings-form__email__error-message"]',
  mobileCountryCodeOptions: '[data-testid="your-settings-form__country-code__dropdown"]',
  countryCodeFilter: '[data-testid="your-settings-form__country-code__filter-input"]',
  countryCodeOption: (countryCode) => `#countryCallCode_${countryCode}`,
  mobileInput: '[data-testid="your-settings-form__mobile__input"]',
  mobileError: '[data-testid="your-settings-form__mobile__error-message"]',
  firstNameInput: '[data-testid="your-settings-form__first-name__input"]',
  firstNameError: '[data-testid="your-settings-form__first-name__error-message"]',
  lastNameInput: '[data-testid="your-settings-form__last-name__input"]',
  lastNameError: '[data-testid="your-settings-form__last-name__error-message"]',
  timezoneFilter: '[data-testid="your-settings-form__timezone__dropdown-filter-input"]',
  timezoneOptions: '[data-testid="your-settings-form__timezone__dropdown"]',
  language: '[data-testid="your-settings-form__language"]',
  oldPasswordInput: '[data-testid="your-settings-form__old-password__input"]',
  newPasswordInput: '[data-testid="your-settings-form__new-password__input"]',
  confirmPasswordInput: '[data-testid="your-settings-form__confirm-password__input"]',
  confirmPasswordError: '[data-testid="your-settings-form__confirm-password__error-message"]',
  twoFactorToggle: '[data-testid="your-settings-form__enforce-mfa"]'
}
