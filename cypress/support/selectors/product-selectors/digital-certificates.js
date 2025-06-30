export default {
  createDigitalCertificateButton:
    '[data-testid="create_Digital Certificate_button"] > .p-button-icon',
  digitalCertificateName: '[data-testid="digital-certificate__name-field__input"]',
  breadcrumbReturnToList: '[data-testid="page-heading-block__breadcrumb__Digital Certificates"]',
  importTrustedCARadioOption:
    '[data-testid="digital-certificate-create-form__certificate-type__radio__certificateType-radio-2"]',
  editPageTitle: '[data-testid="page_title_Edit Digital Certificate"]',
  trustedCATextArea: '[data-testid="trusted-certificates-form__certificate-field__textarea"]',
  serverCertificateTextArea:
    '[data-testid="import-server-certificate-form__certificate-field__textarea"]',
  privateKeyTextArea: '[data-testid="import-server-certificate-form__private-key-field__textarea"]',
  generateCSRRadioOption:
    '[data-testid="digital-certificate-create-form__certificate-type__radio__certificateType-radio-1"]',

  subjectNameInput: '[data-testid="digital-certificate__subject-name-field__input"]',
  countryInput: '[data-testid="digital-certificate__country__input"]',
  stateInput: '[data-testid="digital-certificate__state__input"]',
  cityInput: '[data-testid="digital-certificate__city__input"]',
  organizationInput: '[data-testid="digital-certificate__organization__input"]',
  organizationUnitInput: '[data-testid="digital-certificate__organization-unit__input"]',
  emailInput: '[data-testid="digital-certificate__email__input"]',
  sanTextarea: '[data-testid="digital-certificate__san__textarea"]',
  csrLabel: '[data-testid="digital-certificate__csr__label"]',
  copyCsrButton: '[data-testid="digital-certificate__copy-csr__button"]',
  copyCsrMessage: '[data-testid="digital-certificate__copy-csr__message"]',

  clickImportServerCertificate: '#overlay_menu_0 > .p-menuitem-content > .p-menuitem-link',
  clickGenerateCSR: '#overlay_menu_0_1 > .p-menuitem-content > .p-menuitem-link',
  clickImportTrustedCertificate: '#overlay_menu_1 > .p-menuitem-content > .p-menuitem-link',
  clickImportCRL: '#overlay_menu_2 > .p-menuitem-content > .p-menuitem-link',
  clickDropdown: '#pv_id_61 > .p-dropdown-label',
  clickDropdownOption: '#pv_id_61_0'
}
