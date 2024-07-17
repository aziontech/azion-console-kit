export default {
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
  digitalCertificateFieldSelectedValue:
    ':nth-child(4) > [data-testid="field-dropdown__dropdown"] > .p-dropdown-label',
  digitalCertificateDropdown:
    '[data-testid="domains-form__edge-certificate-field__dropdown"] > .p-dropdown-label',
  letsEncryptDropdownOption: '#edgeCertificate_1',
  editPageTitle: '[data-testid="page_title_Edit Domain"]',
  enableMtlsSwitch:
    '[data-testid="domains-form__mtls-is-enabled-field__switch"] > .p-inputswitch-slider',
  dropdownTrustedCA:
    '[data-testid="domains-form__mtls-trusted-certificate-field__dropdown"] > .p-dropdown-label',
  trustedCAFirstDropdownOption: '#mtlsTrustedCertificate_0',
  mtlsTrustedCAFieldSelectedValue:
    ':nth-child(4) > .max-w-3xl > .sm\\:max-w-xs > [data-testid="field-dropdown__dropdown"] > .p-dropdown-label',
  fieldTextInput: '[data-testid="field-text__input"]',
  domainUri: '[data-testid="edit-domains-form__domain-field__input"]',
  editFormCopyDomainButton: '[data-testid="edit-domains-form__domain-field__copy-button"]',
  activeSwitchEditForm: '[data-testid="edit-domains-form__active-field__switch"]',
  formActionsSubmitButton: '[data-testid="form-actions-submit-button"] > .p-button-label',
  dataTableSearchInput: '[data-testid="data-table-search-input"]',
  listTableBlockColumnNameRow: '[data-testid="list-table-block__column__name__row"]',
  listTableBlockColumnActiveRow:
    '[data-testid="list-table-block__column__active__row"] > .p-tag-value'
}
