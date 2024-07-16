export default {
  createButton: '[data-testid="create_Edge Application_button"]',
  nameInput: '[data-testid="form-horizontal-general-name__input"]',
  originType: '[data-testid="origin-form__origin-type__dropdown"]',
  addressInput: '[data-testid="form-horizontal-default-origin-address-field-text__input"]',
  originAddressInput: '[data-testid="origin-form__address__input"]',
  goBackButton: '[data-testid="action-bar__go-back"]',
  leavePageButton: '[data-testid="dialog-unsaved__leave-page"]',
  saveButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  tableRowName: '[data-testid="list-table-block__column__name__row"]',
  tableRowLastEditor: '[data-testid="list-table-block__column__lastEditor__row"]',
  tableRowAddress: '[data-testid="list-table-block__column__addresses__row"]',
  addErrorResponse: '[data-testid="error-responses-form__add-button"]',
  errorResponseOrigin: '[data-testid="error-responses-form__origin__dropdown"]',
  errorResponseStatusCodes: (optionIdx) =>
    `[data-testid="error-responses-form__error-response__${optionIdx}__status-code__dropdown"]`,
  errorResponseCustomStatus: (optionIdx) =>
    `[data-testid="error-responses-form__error-response__${optionIdx}__custom-status__input"]`,
  errorResponsePaths: (optionIdx) =>
    `[data-testid="error-responses-form__error-response__${optionIdx}__path__input"]`,
  rulesEngineTab: 'li:nth-child(6)',
  tabOption: (optionIdx) => `#tab_${optionIdx}`,
  createOrigin: '[data-testid="origins__add-button"]',
  addRuleButton: '[data-testid="rules-engine-create-button"]',
  ruleNameInput: '[data-testid="rule-form-general-name__input"]',
  criteriaOperatorDropdown:
    '[data-testid="rule-form-criteria-item-conditional-operator__dropdown"] > .p-dropdown-trigger',
  criteriaOperator: 'li[aria-label="is equal"]',
  criteriaInputValue: '[data-testid="rule-form-criteria-item-conditional-input-field-text__input"]',
  behaviorsDropdown:
    '[data-testid="rule-form-behaviors-item-name__dropdown"] > .p-dropdown-trigger',
  behaviors: '#behaviors\\[0\\]\\.name_4',
  ruleTable: '.p-datatable-tbody > tr > :nth-child(2) > div',
  actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
  deleteButton: '[data-testid="data-table-actions-column-body-actions-menu"]',
  deleteInput: '[data-testid="delete-dialog-confirmation-input-field"]',
  confirmDeleteButton: '[data-testid="delete-dialog-footer-delete-button"]',
  cacheSettings: {
    createButton:
      '[data-testid="edge-application-cache-settings-list__create-cache-settings__button"]',
    nameInput: '[data-testid="edge-application-cache-settings-form__name-field__input"]',
    browserCacheSettingsRadio: (position) =>
      `[data-testid="edge-application-cache-settings-form__browser-cache-settings-field__radio"][name="browserCacheSettings-radio-${position}"]`,
    cdnCacheSettingsRadio: (position) =>
      `[data-testid="edge-application-cache-settings-form__cdn-cache-settings-field__radio"][name="cdnCacheSettings-radio-${position}"]`,
    browserCacheSettingsMaxTtlInput:
      '[data-testid="edge-application-cache-settings-form__browser-cache-settings-maximum-ttl-field__input"]',
    cdnCacheSettingsMaxTtlInput:
      '[data-testid="edge-application-cache-settings-form__cdn-cache-settings-maximum-ttl-field__input"]',
    cacheByQueryStringRadio: (position) =>
      `[data-testid="edge-application-cache-settings-form__cache-by-query-string-field__radio"][name="cacheByQueryString-radio-${position}"]`,
    cacheByCookieRadio: (position) =>
      `[data-testid="edge-application-cache-settings-form__cache-by-cookie-field__radio"][name="cacheByCookies-radio-${position}"]`
  },
  list: {
    tableRow: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`,
    tabs: (tabName) => `[data-testid="edge-application-details-tab-panel__${tabName}__tab"] a`
  }
}
