export default {
  createButton: '[data-testid="create_User_button"]',
  firstNameInput: '[data-testid="users-form__first-name-field__input"]',
  firstNameErrorMessage: '[data-testid="users-form__first-name-field__error-message"]',
  lastNameInput: '[data-testid="users-form__last-name-field__input"]',
  lastNameErrorMessage: '[data-testid="users-form__last-name-field__error-message"]',
  emailInput: '[data-testid="users-form__email-field__input"]',
  emailErrorMessage: '[data-testid="users-form__email-field__error-message"]',
  phoneInput: '[data-testid="users-form__phone-field__input"]',
  phoneErrorMessage: '[data-testid="users-form__phone-field__error-message"]',
  languageDropdown: '[data-testid="users-form__language-field__dropdown"]',
  timezoneDropdown: '[data-testid="users-form__timezone-field__dropdown"]',
  timezoneFilter: '[data-testid="users-form__timezone-field__dropdown"] .p-dropdown-filter',
  timezoneOption: (index) => `#timezone_${index}`,
  teamDropdownTrigger: '[data-testid="users-form__teams-field__multiselect-trigger"]',
  teamDropdownFilter: '[data-testid="users-form__teams-field__multiselect-filter"]',
  teamOption: (index) => `#teams_${index}`,
  selectedTeamTag: (optionNumber) =>
    `[data-testid="users-form__teams-field__multiselect"] :nth-child(${optionNumber})`,
  selectedTeamTagCloseBtn: (optionNumber) =>
    `[data-testid="users-form__teams-field__multiselect"] :nth-child(${optionNumber}) .p-icon`,
  selectedTeamErrorMessage: '[data-testid="users-form__teams-field__error-message"]',
  switchSocialLogin: '[data-testid="users-form__mfa-field__switch-isAccountOwner"]',
  switchMultiFactorAuth: '[data-testid="users-form__mfa-field__switch-twoFactorEnabled"]',
  listRow: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`
}
