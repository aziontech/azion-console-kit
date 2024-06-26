const selectors = {
  list: {
    breadcumbReturnToList: ':nth-child(3) > .p-menuitem-link',
    createDigitalCertificateButton: '[data-testid="create_Digital Certificate_button"]',
    createTeamButton: '[data-testid="create_Team_button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    searchField: '[data-testid="data-table-search-input"]',
    filteredRow: {
      nameColumn: (columnName = 'name') =>
        `[data-testid="list-table-block__column__${columnName}__row"]`,
      statusColumn: '[data-testid="list-table-block__column__status__row"] > .p-tag-value',
      permissionsColumn: '.p-selectable-row > :nth-child(2)',
      empty: 'tr.p-datatable-emptymessage > td',
      lastEditorColumn: '[data-testid="list-table-block__column__lastEditor__row"]',
      lastModifiedColumn: '[data-testid="list-table-block__column__lastModified__row"]'
    },
    actionsMenu: {
      button: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
      deleteButton: '[data-testid="data-table-actions-column-body-actions-menu"]'
    },
    deleteDialog: {
      confirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]',
      deleteButton: '[data-testid="delete-dialog-footer-delete-button"]'
    },
    toast: {
      content: '.p-toast-message-content'
    }
  },
  form: {
    digitalCertificateName: '[data-testid="digital-certificate__name-field__input"]',
    teamName: '[data-testid="teams-permissions-form__name__field-text__input"]',
    teamNameError: '[data-testid="teams-permissions-form__name__field-text__error-message"]',
    teamStatus: '[data-testid="teams-permissions-form__form-fields__status"]',
    allPermissionsToTarget: '[aria-label="Move All to Target"] > .p-icon',
    allPermissionsToSource: '[aria-label="Move All to Source"] > .p-icon',
    singlePermissionToTarget: 'button[aria-label="Move to Target"]',
    viewContentDeliverySettingsPermission:
      '[data-testid="teams-permissions-form__permissions-field__picklist__item-View Content Delivery Settings"]',
    actionsSubmitButton: '[data-testid="form-actions-submit-button"]',
    actionsCancelButton: '[data-testid="form-actions-cancel-button"]',
    submitButton: '[data-testid="form-actions-submit-button"]',
    editPageTitle: '[data-testid="page_title_Edit Digital Certificate"]'
  },
  toast: {
    createSuccessMessage: ':nth-child(2) > .p-toast-message-content > .flex-column > .text-sm',
    deleteSuccessMessage:
      ':nth-child(3) > .p-toast-message-content > .flex-column > .flex > .text-color',
    content: '.p-toast-message-content',
    closeBtn: ':nth-child(2) >.p-toast-message-content .p-toast-icon-close'
  },
  login: {
    emailInput: '[data-testid="signin-block__email-input"]',
    nextButton: '[data-testid="signin-block__next-button"] > .p-button-label',
    passwordInput: '[data-testid="signin-block__password-input"] > .p-inputtext',
    signInButton: '[data-testid="signin-block__signin-button"] > .p-button-label'
  },
  menuSidebar: {
    toggleButton: '[data-testid="sidebar-block__toggle-button"] > .p-button-icon',
    menuItem: (productName) => `[data-testid="sidebar-block__menu-item__${productName}"]`
  },
  menuAccount: {
    avatarIcon: '[data-testid="profile-block__avatar"]',
    menuItem: (menuAccountLabel) =>
      `li[aria-label="${menuAccountLabel}"] > .p-menuitem-content > .p-menuitem-link`
  },
  edgeApplication: {
    createButton: '.p-datatable-header > .flex-wrap > .p-button > .p-button-label',
    nameInput: '[data-testid="form-horizontal-general-name__input"]',
    addressInput: '[data-testid="form-horizontal-default-origin-address-field-text__input"]',
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    tableRowName: '[data-testid="list-table-block__column__name__row"]',
    tableRowLastEditor: '[data-testid="list-table-block__column__lastEditor__row"]',
    rulesEngineTab: 'li:nth-child(6)',
    addRuleButton: '[data-testid="rules-engine-create-button"]',
    ruleNameInput: '[data-testid="rule-form-general-name__input"]',
    criteriaOperatorDropdown:
      '[data-testid="rule-form-criteria-item-conditional-operator"] > .p-dropdown-trigger',
    criteriaOperator: 'li[aria-label="is equal"]',
    criteriaInputValue:
      '[data-testid="rule-form-criteria-item-conditional-input-field-text__input"]',
    behaviorsDropdown: '[data-testid="rule-form-behaviors-item-name"] > .p-dropdown-trigger',
    behaviors: '#behaviors\\[0\\]\\.name_4',
    ruleTable: '.p-datatable-tbody > tr > :nth-child(2) > div',
    actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
    deleteButton: '[data-testid="data-table-actions-column-body-actions-menu"]',
    deleteInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    confirmDeleteButton: '[data-testid="delete-dialog-footer-delete-button"]'
  },
  credential: {
    createCredentialBtn: '[data-testid="create_Credential_button"]',
    nameInput: '[data-testid="credentials-create-form__name-field__input"]',
    nameErrorText: '[data-testid="credentials-create-form__name-field__error-message"]',
    descriptionField: '[data-testid="credentials-create-form__description-field__textarea"]',
    tokenInput: '[data-testid="credentials-create-form__token-field__input"]',
    tokenErrorText: '[data-testid="credentials-create-form__token-field__error-text"]',
    tokenCopyButton: '[data-testid="credentials-create-form__token-field__copy-token-button"]',
    statusSwitch: '[data-testid="credentials-create-form__status-field__switch"]'
  },
  contact: {
    emailInput: '[data-testid="contact__email__input"]',
    emailError: '[data-testid="contact__email__error-message"]',
    mobileCountryCodeOptions: '[data-testid="contact__mobile__country-code-options"]',
    countryCodeFilter: '.p-dropdown-filter',
    countryCodeOption: (countryCode) => `#countryCallCode_${countryCode}`,
    mobileInput: '[data-testid="contact__mobile__input"]',
    mobileError: '[data-testid="contact__mobile__error-text"]'
  },
  profile: {
    firstNameInput: '[data-testid="profile__first-name__input"]',
    firstNameError: '[data-testid="profile__first-name__error-message"]',
    lastNameInput: '[data-testid="profile__last-name__input"]',
    lastNameError: '[data-testid="profile__last-name__error-message"]',
    timezoneOptions: '[data-testid="profile__timezone__options"]',
    language: '[data-testid="profile__language"]'
  },
  security: {
    oldPasswordInput: '[data-testid="security__old-password__input"]',
    newPasswordInput: '[data-testid="security__new-password__input"]',
    confirmPasswordInput: '[data-testid="security__confirm-password__input"]',
    confirmPasswordError: '[data-testid="security__confirm-password__error-text"]',
    twoFactorToggle: '.p-inputswitch-slider'
  },
  networkLists: {
    createButton: '[data-testid="create_Network List_button"] > .p-button-label',
    nameInput: '[data-testid="network-list-form__name__input',
    typeDropdown: '[data-testid="network-list-form__type__dropdown',
    asnTextarea: '[data-testid="network-list-form__asn-list__textarea',
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    nameRow: '[data-testid="list-table-block__column__name__row"]',
    typeRow: '[data-testid="list-table-block__column__listType__row"]',
    actionButton:
      '[data-testid="data-table-actions-column-body-actions-menu-button"] > .p-button-icon',
    deleteButton: '.p-menuitem-content > .p-menuitem-link > .p-menuitem-text',
    deleteInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    confirmDeleteButton: '[data-testid="delete-dialog-footer-delete-button"] > .p-button-label'
  },
  variables: {
    createButton: '[data-testid="create_Variable_button"] > .p-button-label',
    keyInput: '[data-testid="variables-form__key-field__input"]',
    valueInput: '[data-testid="variables-form__value-field__input"]',
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    keyRow: '[data-testid="list-table-block__column__key__row"]',
    valueRow: '.whitespace-pre',
    actionButton:
      '[data-testid="data-table-actions-column-body-actions-menu-button"] > .p-button-icon',
    deleteButton: '.p-menuitem-content > .p-menuitem-link > .p-menuitem-text',
    deleteInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    confirmDeleteButton: '[data-testid="delete-dialog-footer-delete-button"] > .p-button-label'
  },
  wafs: {
    createButton: '[data-testid="create_WAF Rule_button"] > .p-button-label',
    nameInput: '[data-testid="waf-rules-form__name-field__input"]',
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    nameRow: '[data-testid="list-table-block__column__name__row"]',
    threatTypesRow: '[data-testid="list-table-block__column__threatTypes__row"] > :nth-child(1)',
    actionButton:
      '[data-testid="data-table-actions-column-body-actions-menu-button"] > .p-button-icon',
    deleteButton: '.p-menuitem-content > .p-menuitem-link > .p-menuitem-text',
    deleteInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    confirmDeleteButton: '[data-testid="delete-dialog-footer-delete-button"] > .p-button-label'
  },
  functions: {
    createButton: '[data-testid="create_Edge Function_button"] > .p-button-label',
    nameInput: '[data-testid="field-text__input"]',
    saveButton: '[data-testid="form-actions-submit-button"] > .p-button-label',
    cancelButton: '[data-testid="form-actions-cancel-button"] > .p-button-label',
    searchInput: '[data-testid="data-table-search-input"]',
    nameRow: '[data-testid="list-table-block__column__name__row"] > p',
    languageRow: '[data-testid="list-table-block__column__language__row"] > p',
    initiatorTypeRow: '[data-testid="list-table-block__column__initiatorType__row"]'
  },
  edgeFirewall: {
    createButton: '[data-testid="create_Edge Firewall_button"] > .p-button-label',
    nameInput: '[data-testid="edge-firewall-form__name-field__input"]',
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    nameRow: '[data-testid="list-table-block__column__name__row"]',
    activeRow: '[data-testid="list-table-block__column__status__row"] > .p-tag-value',
    actionButton:
      '[data-testid="data-table-actions-column-body-actions-menu-button"] > .p-button-icon',
    deleteButton: '.p-menuitem-content > .p-menuitem-link > .p-menuitem-text',
    deleteInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    confirmDeleteButton: '[data-testid="delete-dialog-footer-delete-button"] > .p-button-label'
  },
  accountSettings: {
    accountName: '[data-testid="account-settings__account-name__input"]',
    companyName: '[data-testid="account-settings__company-name__input"]',
    companyId: '[data-testid="account-settings__company-id__input"]',
    postalCode: '[data-testid="account-settings__postal-code__input"]',
    postalCodeError: '[data-testid="account-settings__postal-code__error-message"]',
    submitButton: '[data-testid="form-actions-submit-button"] > .p-button-label'
  }
}

export default selectors
