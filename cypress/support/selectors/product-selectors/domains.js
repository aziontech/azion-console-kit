export default {
  createButton: '[data-testid="create_Domain_button"]',
  nameInput: '[data-testid="domains-form__name-field__input"]',
  portHttp: '[data-testid="form-horizontal-delivery-settings-http-ports-multi-select"]',
  portHttps: '[data-testid="form-horizontal-delivery-settings-https-ports-multi-select"]',
  useHttpsField: '[data-testid="domains-form__use-https-field"]',
  useHttp3Field: '[data-testid="domains-form__use-http3-field"]',
  dropdownSelectPort: '.p-multiselect-items-wrapper ul',
  dropdownSelectTls: '.p-dropdown-items-wrapper #minimumTlsVersion_list',
  dropdownSelectCipher: '.p-dropdown-items-wrapper #supportedCiphers_list',
  cipherSuite: '[data-testid="form-horizontal-delivery-settings-cipher-suite-field-dropdown__dropdown"]',
  tlsVersion: '[data-testid="form-horizontal-delivery-settings-tls-version-field-dropdown__dropdown"]',
  edgeApplicationField: '[data-testid="domains-form__edge-application-field__dropdown"]',
  edgeApplicationDropdownFilter:
    '[data-testid="domains-form__edge-application-field__dropdown-filter-input"]',
  edgeFirewallField: '[data-testid="domains-form__edge-firewall-field__dropdown"]',
  mtlsTrustedCADropdownFilter:
    '[data-testid="domains-form__mtls-trusted-certificate-field__dropdown-search"]',
  edgeApplicationOption: '#edgeApplication_0',
  edgeCertificateOption: '#edgeCertificate_0',
  cnamesField: '[data-testid="domains-form__cnames-field__textarea"]',
  createEdgeApplicationButton: '[data-testid="domains-form__create-edge-application-button"]',
  createEdgeFirewallButton: '[data-testid="domains-form__create-edge-firewall-button"]',
  edgeApplicationDrawer: '.p-sidebar-content',
  dialogTitle: '[data-testid="domains-view__copy-domain-dialog__header-title"]',
  domainField: '[data-testid="domains-dialog__domain-field__input"]',
  digitalCertificateDropdownFilter:
    '[data-testid="domains-form__edge-certificate-field__dropdown-filter-input"]',
  createDigitalCertificateButton: '[data-testid="domains-form__create-digital-certificate-button"]',
  digitalCertificateActionBar: '[data-testid="digital-certificates-drawer__action-bar"]',
  edgeFirewallActionBar: '[data-testid="edge-firewall-drawer__action-bar"]',
  cnameAccessOnlyField: '[data-testid="domains-form__cname-access-only-field"]',
  copyDomainButton: '[data-testid="domains-dialog__copy-domain__button"]',
  confirmButton: '[data-testid="domains-dialog__confirm__button"]',
  pageTitle: (entityName) => `[data-testid="page_title_${entityName}"]`,
  digitalCertificateFieldSelectedValue:
    ':nth-child(4) > [data-testid="field-dropdown__dropdown"] > .p-dropdown-label',
  digitalCertificateDropdownSearch: '[data-testid="domains-form__digital-certificates-field__dropdown-search"]',
  digitalCertificateDropdown:
    '[data-testid="domains-form__edge-certificate-field__dropdown"] > .p-dropdown-label',
  digitalCertificateDropdownFilterSearch: '[data-testid="domains-form__edge-certificate-field__dropdown-search"]',
  digitalCertificatesDropdownLetsEncrypt: '[data-testid="domains-form__digital-certificates-field__dropdown"] > .p-dropdown-label',
  letsEncryptDropdownOption: '#edgeCertificate_1',
  editPageTitle: '[data-testid="page-heading-block__breadcrumb__Edit Domain"] > .p-menuitem-link > .p-menuitem-text',
  enableMtlsSwitch:
    '[data-testid="domains-form__mtls-is-enabled-field__switch"] > .p-inputswitch-slider',
  dropdownTrustedCA:
    '[data-testid="domains-form__mtls-trusted-certificate-field__dropdown"] > .p-dropdown-label',
  trustedCAFirstDropdownOption: '#mtlsTrustedCertificate_0',
  mtlsTrustedCAFieldSelectedValue:
    ':nth-child(5) > .max-w-3xl > .sm\\:max-w-xs > [data-testid="field-dropdown__dropdown"] > .p-dropdown-label',
  fieldTextInput: '[data-testid="field-text__input"]',
  domainUri: '[data-testid="edit-domains-form__domain-field__input"]',
  editFormCopyDomainButton: '[data-testid="edit-domains-form__domain-field__copy-button"]',
  activeSwitchEditForm: '[data-testid="edit-domains-form__active-field__switch"]',
  formActionsSubmitButton: '[data-testid="form-actions-submit-button"] > .p-button-label',
  dataTableSearchInput: '[data-testid="data-table-search-input"]',
  listTableBlockColumnNameRow: '[data-testid="list-table-block__column__name__row"]',
  listTableBlockColumnActiveRow:
    '[data-testid="list-table-block__column__active__row"] > .p-tag-value',
  edgeApplicationSaveButton: '[data-testid="create-drawer-block__action-bar"] > [data-testid="form-actions-content"] > [data-testid="form-actions-buttons"] > [data-testid="form-actions-submit-button"] > .p-button-label',
  edgeFirewallSaveButton: '[data-testid="edge-firewall-drawer__action-bar"] > [data-testid="form-actions-content"] > [data-testid="form-actions-buttons"] > [data-testid="form-actions-submit-button"] > .p-button-label',
  edgeApplicationDropdownSearch: '[data-testid="domains-form__edge-application-field__dropdown-search"]'
}
