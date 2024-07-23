export default {
  createDigitalCertificateButton: '[data-testid="create_Digital Certificate_button"]',
  digitalCertificateName: '[data-testid="digital-certificate__name-field__input"]',
  breadcumbReturnToList: '[data-testid="page-heading-block__breadcrumb__Digital Certificates"]',
  importTrustedCARadioOption:
    '[inputvalue="trusted_ca_certificate"] > .p-card-body > .p-card-content > .p-4',
  editPageTitle: '[data-testid="page_title_Edit Digital Certificate"]',
  trustedCATextArea: '[data-testid="trusted-certificates-form__certificate-field__textarea"]',
  serverCertificateTextArea: '[data-testid="digital-certificate__certificate-field__textarea"]',
  privateKeyTextArea: '[data-testid="digital-certificate__private-key-field__textarea"]',
  generateCSRRadioOption:
    '[inputvalue="generateCSR"] > .p-card-body > .p-card-content > .p-4 > :nth-child(1) > .p-radiobutton > .p-radiobutton-box',
  subjectNameInput: '[data-testid="digital-certificate__subject-name__input"]',
  countryInput: '[data-testid="digital-certificate__country__input"]',
  stateInput: '[data-testid="digital-certificate__state__input"]',
  cityInput: '[data-testid="digital-certificate__city__input"]',
  organizationInput: '[data-testid="digital-certificate__organization__input"]',
  organizationUnitInput: '[data-testid="digital-certificate__organization-unit__input"]',
  emailInput: '[data-testid="digital-certificate__email__input"]',
  sanTextarea: '[data-testid="digital-certificate__san__textarea"]',
  csrLabel: '[data-testid="digital-certificate__csr__label"]',
  copyCsrButton: '[data-testid="digital-certificate__copy-csr__button"]',
  copyCsrMessage: '[data-testid="digital-certificate__copy-csr__message"]'
}
