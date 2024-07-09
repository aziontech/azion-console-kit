const selectors = {
  list: {
    breadcumbReturnToList: ':nth-child(3) > .p-menuitem-link',
    createDigitalCertificateButton: '[data-testid="create_Digital Certificate_button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    searchField: '[data-testid="data-table-search-input"]',
    filteredRow: {
      nameColumn: (columnName = 'name') =>
        `[data-testid="list-table-block__column__${columnName}__row"]`,
      statusColumn: '[data-testid="list-table-block__column__status__row"] > .p-tag-value',
      empty: 'tr.p-datatable-emptymessage > td',
      lastEditorColumn: '[data-testid="list-table-block__column__lastEditor__row"]',
      lastModifiedColumn: '[data-testid="list-table-block__column__lastModified__row"]'
    },
    actionsMenu: {
      button: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
      deleteButton: '[data-testid="data-table-actions-column-body-actions-menu"]'
    },
    singleActionsMenu: {
      button: '[data-testid="data-table-actions-column-body-action-button"]'
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
      '[data-testid="rule-form-criteria-item-conditional-operator__dropdown"] > .p-dropdown-trigger',
    criteriaOperator: 'li[aria-label="is equal"]',
    criteriaInputValue:
      '[data-testid="rule-form-criteria-item-conditional-input-field-text__input"]',
    behaviorsDropdown:
      '[data-testid="rule-form-behaviors-item-name__dropdown"] > .p-dropdown-trigger',
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
  yourSettings: {
    emailInput: '[data-testid="your-settings-form__email__input"]',
    emailError: '[data-testid="your-settings-form__email__error-message"]',
    mobileCountryCodeOptions: '[data-testid="your-settings-form__country-code__dropdown"]',
    countryCodeFilter: '.p-dropdown-filter',
    countryCodeOption: (countryCode) => `#countryCallCode_${countryCode}`,
    mobileInput: '[data-testid="your-settings-form__mobile__input"]',
    mobileError: '[data-testid="your-settings-form__mobile__error-message"]',
    firstNameInput: '[data-testid="your-settings-form__first-name__input"]',
    firstNameError: '[data-testid="your-settings-form__first-name__error-message"]',
    lastNameInput: '[data-testid="your-settings-form__last-name__input"]',
    lastNameError: '[data-testid="your-settings-form__last-name__error-message"]',
    timezoneOptions: '[data-testid="your-settings-form__timezone__dropdown"]',
    language: '[data-testid="your-settings-form__language"]',
    oldPasswordInput: '[data-testid="your-settings-form__old-password__input"]',
    newPasswordInput: '[data-testid="your-settings-form__new-password__input"]',
    confirmPasswordInput: '[data-testid="your-settings-form__confirm-password__input"]',
    confirmPasswordError: '[data-testid="your-settings-form__confirm-password__error-message"]',
    twoFactorToggle: '.p-inputswitch-slider'
  },
  networkLists: {
    createButton: '[data-testid="create_Network List_button"] > .p-button-label',
    nameInput: '[data-testid="network-list-form__name__input"]',
    typeDropdown: '[data-testid="network-list-form__type__dropdown"]',
    asnTextarea: '[data-testid="network-list-form__asn-list__textarea"]',
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
  edgePulse: {
    defaultTagCopyButton: '[data-testid="edge-pulse__default-tag-copy-button"] > .p-button-label',
    preLoadingTab: '[data-testid="edge-pulse__pre-loading-tab"]',
    preLoadingTagCopyButton:
      '[data-testid="edge-pulse__pre-loading-tag-copy-button"] > .p-button-label'
  },
  edgeServices: {
    createServiceButton: '[data-testid="create_Service_button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    filteredRowNameColumn: '[data-testid="list-table-block__column__name__row"]',
    filteredRowStatusColumn:
      '[data-testid="list-table-block__column__labelActive__row"] > .p-tag-value',
    actionsMenuButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
    actionsMenuDeleteAction:
      '#overlay_menu_1 > .p-menuitem-content > .p-menuitem-link > .p-menuitem-text',
    deleteDialogConfirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]',
    serviceName: '[data-testid="edge-service-form__name-field__input"]',
    nameRequiredLabel: '[data-testid="edge-service-form__name-field__error-message"]',
    submitButton: '[data-testid="form-actions-submit-button"]',
    pageTitle: (entityName) => `[data-testid="page_title_${entityName}"]`,
    cancelButton: '[data-testid="form-actions-cancel-button"]'
  },
  personalTokens: {
    createTokenButton: '[data-testid="create_Personal Token_button"]',
    searchInput: '[data-testid="data-table-search-input"]',
    filteredRecordNameColumn: '[data-testid="list-table-block__column__name__row"]',
    filteredRecordMenuButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
    filteredRecordDeleteButton: '.p-menuitem-content > .p-menuitem-link',
    deleteDialogConfirmationInputField: '[data-testid="delete-dialog-confirmation-input-field"]',
    tokenName: '[data-testid="personal-token-form__name-field__input"]',
    submitButton: '[data-testid="form-actions-submit-button"]',
    copyTokenDialogHeader: '[data-testid="copy-token-dialog__header"] > .p-dialog-header',
    copyTokenButton: '[data-testid="copy-token-dialog__token-field__copy-token-button"]',
    closeCopyDialogButton: '[data-testid="copy-token-dialog__dialog-footer__confirm-button"]'
  },
  accountSettings: {
    accountName: '[data-testid="account-settings__account-name__input"]',
    companyName: '[data-testid="account-settings__company-name__input"]',
    companyId: '[data-testid="account-settings__company-id__input"]',
    billingEmails: '[data-testid="account-settings__billing-emails__textarea"]',
    postalCode: '[data-testid="account-settings__postal-code__input"]',
    dropdownFilter: '.p-dropdown-filter',
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
    submitButton: '[data-testid="form-actions-submit-button"] > .p-button-label'
  },
  dataStream: {
    createButton: '[data-testid="create_Stream_button"]',
    nameInput: '[data-testid="data-stream-form__general__name-field__input"]',
    sourceDropdown: '[data-testid="data-stream-form__data-settings__data-source-field__dropdown"]',
    templateDropdown: '[data-testid="data-stream-form__data-settings__template-field__dropdown"]',
    editorBody: '.view-lines',
    connectorDropdown:
      '[data-testid="data-stream-form__destination__connector-field__dropdown"] > .p-dropdown-trigger',
    connectorOption: (optionIdx) => `#endpoint_${optionIdx}`,
    httpConnector: {
      urlInput: '[data-testid="data-stream-form__destination__url-field__input"]',
      headersInput: '[data-testid="data-stream-form__destination__headers-field__input"]',
      payloadInput: '[data-testid="data-stream-form__destination__payload-format-field__input"]',
      separatorInput:
        '[data-testid="data-stream-form__destination__payload-line-separator-field__input"]',
      maxSizeInput:
        '[data-testid="data-stream-form__destination__payload-max-size-field__input"] > .p-inputtext'
    },
    kafkaConnector: {
      serverTextarea:
        '[data-testid="data-stream-form__destination__bootstrap-servers-field__textarea"]',
      topicInput: '[data-testid="data-stream-form__destination__kafka-topic-field__input"]',
      useTlsSlider:
        '[data-testid="data-stream-form__destination__use-tls-field"] > .p-inputswitch-slider'
    },
    s3Connector: {
      urlInput: '[data-testid="data-stream-form__destination__url-field__input"]',
      bucketInput: '[data-testid="data-stream-form__destination__bucket-field__input"]',
      regionInput: '[data-testid="data-stream-form__destination__region-field__input"]',
      accessKeyInput: '[data-testid="data-stream-form__destination__access-key-field__input"]',
      secretKeyInput: '[data-testid="data-stream-form__destination__secret-key-field__input"]',
      objectKeyPrefixInput:
        '[data-testid="data-stream-form__destination__object-key-prefix-field__input"]'
    },
    bigQueryConnector: {
      projectIdInput: '[data-testid="data-stream-form__destination__project-id-field__input"]',
      datasetIdInput: '[data-testid="data-stream-form__destination__dataset-id-field__input"]',
      tableIdInput: '[data-testid="data-stream-form__destination__table-id-field__input"]',
      serviceAccountKeyInput:
        '[data-testid="data-stream-form__destination__service-account-key-field__input"]'
    },
    elasticsearchConnector: {
      urlInput: '[data-testid="data-stream-form__destination__elasticsearch-url-field__input"]',
      apiKeyTextarea: '[data-testid="data-stream-form__destination__api-key-field__textarea"]'
    },
    splunkConnector: {
      urlInput: '[data-testid="data-stream-form__destination__splunk-url-field__input"]',
      apiKeyTextarea:
        '[data-testid="data-stream-form__destination__splunk-api-key-field__textarea"]'
    },
    awsKinesisConnector: {
      streamNameInput:
        '[data-testid="data-stream-form__destination__kinesis-stream-name-field__input"]',
      regionInput: '[data-testid="data-stream-form__destination__kinesis-region-field__input"]',
      accessKeyInput:
        '[data-testid="data-stream-form__destination__kinesis-access-key-field__input"]',
      secretKeyInput:
        '[data-testid="data-stream-form__destination__kinesis-secret-key-field__input"]'
    },
    datadogConnector: {
      urlInput: '[data-testid="data-stream-form__destination__datadog-url-field__input"]',
      apiKeyTextarea:
        '[data-testid="data-stream-form__destination__datadog-api-key-field__textarea"]'
    },
    ibmQRadarConnector: {
      urlInput: '[data-testid="data-stream-form__destination__qradar-url-field__input"]'
    },
    azureMonitorConnector: {
      logTypeInput:
        '[data-testid="data-stream-form__destination__azure-monitor-log-type-field__input"]',
      sharedKeyInput:
        '[data-testid="data-stream-form__destination__azure-monitor-shared-key-field__input"]',
      timeGeneratedFieldInput:
        '[data-testid="data-stream-form__destination__azure-monitor-generated-field__input"]',
      workspaceIdInput:
        '[data-testid="data-stream-form__destination__azure-monitor-workspace-id-field__input"]'
    },
    azureBlobStorageConnector: {
      storageAccountInput:
        '[data-testid="data-stream-form__destination__azure-blob-storage-storage-account-field__input"]',
      containerNameInput:
        '[data-testid="data-stream-form__destination__azure-blob-storage-container-name-field__input"]',
      blobSasTokenInput:
        '[data-testid="data-stream-form__destination__azure-blob-storage-blob-token-field__input"]'
    },
    statusSlider: '[data-testid="data-stream-form__section__status"] input',
    list: {
      columnName: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`
    }
  },
  edgeDns: {
    createButton: '[data-testid="create_Zone_button"] > .p-button-label',
    nameInput: '[data-testid="edge-dns-form__name__input"]',
    domainInput: '[data-testid="edge-dns-form__domain__input"]',
    saveButton: '[data-testid="form-actions-submit-button"] > .p-button-label',
    cancelButton: '[data-testid="form-actions-cancel-button"] > .p-button-label',
    searchInput: '[data-testid="data-table-search-input"]',
    nameRow: '[data-testid="list-table-block__column__name__row"]',
    showMore: '.underline',
    domainRow: '.whitespace-pre',
    statusRow: '[data-testid="list-table-block__column__status__row"] > .p-tag-value',
    list: {
      columnName: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`
    },
    records: {
      tab: '[data-testid="edge-dns-edit-view__records__tab-panel"] > a',
      createButton: '[data-testid="create_Record_button"]',
      nameInput: '[data-testid="edge-dns-records-form__settings__name-field__input"]',
      recordTypeDropdown:
        '[data-testid="edge-dns-records-form__settings__record-type-field__dropdown"] > .p-dropdown-trigger',
      recordTypeOption: (recordType) => `#selectedRecordType_${recordType}`,
      ttlInput: '[data-testid="edge-dns-records-form__settings__ttl-field__input"]',
      valueTextarea: '[data-testid="edge-dns-records-form__settings__value-field__textarea"]',
      policyTypeDropdown:
        '[data-testid="edge-dns-records-form__policy__policy-type-field__dropdown"] > .p-dropdown-trigger',
      policyTypeOption: (policyType) => `#selectedPolicy_${policyType}`,
      weightInput: '[data-testid="edge-dns-records-form__policy__weight-field__input"]',
      descriptionTextarea:
        '[data-testid="edge-dns-records-form__policy__description-field__textarea"]'
    }
  },
  domains: {
    createButton: '[data-testid="create_Domain_button"]',
    nameInput: '[data-testid="domains-form__name-field__input"]',
    edgeApplicationField: '[data-testid="domains-form__edge-application-field__dropdown"]',
    dropdownFilter: '.p-dropdown-filter',
    edgeApplicationOption: '#edgeApplication_0',
    cnamesField: '[data-testid="domains-form__cnames-field__textarea"]',
    dialogTitle: '.p-dialog-header > .p-dialog-title',
    domainField: '[data-testid="domains-dialog__domain-field__input"]',
    copyDomainButton: '[data-testid="domains-dialog__copy-domain__button"]',
    confirmButton: '[data-testid="domains-dialog__confirm__button"]',
    pageTitle: (entityName) => `[data-testid="page_title_${entityName}"]`,
    actionDelete: '.p-menuitem-content > .p-menuitem-link'
  },
  purge: {
    createButton: '[data-testid="create_Purge_button"]',
    argumentsField: '[data-testid="purge__arguments-field__textarea"]'
  },
  usersManagement: {
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
    teamDropdownTrigger:
      '[data-testid="users-form__teams-field__multiselect"] .p-multiselect-trigger',
    teamDropdownFilter: '[aria-owns="teams_list"].p-multiselect-filter',
    teamOption: (index) => `#teams_${index}`,
    selectedTeamTag: (optionNumber) =>
      `[data-testid="users-form__teams-field__multiselect"] :nth-child(${optionNumber})`,
    selectedTeamTagCloseBtn: (optionNumber) =>
      `[data-testid="users-form__teams-field__multiselect"] :nth-child(${optionNumber}) .p-icon`,
    selectedTeamErrorMessage: '[data-testid="users-form__teams-field__error-message"]',
    switchSocialLogin: '[data-testid="users-form__mfa-field__switch-isAccountOwner"]',
    switchMultiFactorAuth: '[data-testid="users-form__mfa-field__switch-twoFactorEnabled"]',
    listRow: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`
  },
  teams: {
    createTeamButton: '[data-testid="create_Team_button"]',
    nameInput: '[data-testid="teams-permissions-form__name__field-text__input"]',
    statusSwitch: '[data-testid="teams-permissions-form__form-fields__status"]',
    sourceList: '.p-picklist-list.p-picklist-source-list',
    targetList: '.p-picklist-list.p-picklist-target-list',
    allPermissionsToTarget: '[aria-label="Move All to Target"] > .p-icon',
    allPermissionsToSource: '[aria-label="Move All to Source"] > .p-icon',
    singlePermissionToTarget: 'button[aria-label="Move to Target"]',
    permission: (permissionName) =>
      `[data-testid="teams-permissions-form__permissions-field__picklist__item-${permissionName}"]`,
    listRow: (rowName) => `[data-testid="list-table-block__column__${rowName}__row"]`
  }
}

export default selectors
