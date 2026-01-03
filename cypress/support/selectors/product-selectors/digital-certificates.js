/**
 * Digital Certificates Module Selectors
 *
 * API: v4/workspace/tls/certificates
 * Route: /digital-certificates
 *
 * Certificate Types:
 * - edge_certificate (Server Certificate)
 * - trusted_ca_certificate (Trusted CA)
 * - certificateRevogationList (CRL)
 * - generateCSR (CSR Generation)
 */

export default {
  // List page
  createMenuButton: '[data-testid="create_Certificate Manager_button"]',
  table: '.p-datatable',
  emptyState: '[data-testid*="empty"]',
  searchInput: '[data-testid="data-table-search-input"]',
  nameColumn: '[data-testid*="list-table-block__column__name"]',

  // Create Menu items - use text contains
  menu: {
    overlay: '#overlay_menu',
    serverCertificate: '.p-menuitem-link:contains("Server Certificate")',
    trustedCertificate: '.p-menuitem-link:contains("Trusted Certificate")',
    importCRL: '.p-menuitem-link:contains("CRL")'
  },

  // Form - General
  form: {
    nameInput: '[data-testid="digital-certificate__name-field__input"]',
    nameLabel: '[data-testid="digital-certificate__name-field__label"]'
  },

  // Import Server Certificate
  serverCertificate: {
    certificateTextarea: '[data-testid="import-server-certificate-form__certificate-field__textarea"]',
    privateKeyTextarea: '[data-testid="import-server-certificate-form__private-key-field__textarea"]'
  },

  // Trusted CA Certificate
  trustedCA: {
    certificateTextarea: '[data-testid="trusted-certificates-form__certificate-field__textarea"]'
  },

  // CSR Generation fields
  csr: {
    subjectNameInput: '[data-testid="digital-certificate__subject-name-field__input"]',
    countryInput: '[data-testid="digital-certificate__country__input"]',
    stateInput: '[data-testid="digital-certificate__state__input"]',
    cityInput: '[data-testid="digital-certificate__city__input"]',
    organizationInput: '[data-testid="digital-certificate__organization__input"]',
    organizationUnitInput: '[data-testid="digital-certificate__organization-unit__input"]',
    emailInput: '[data-testid="digital-certificate__email__input"]',
    sanTextarea: '[data-testid="digital-certificate__san__textarea"]',
    csrLabel: '[data-testid="digital-certificate__csr__label"]',
    copyCsrButton: '[data-testid="digital-certificate__copy-csr__button"]'
  },

  // Type selector (radio buttons on create form)
  typeRadio: {
    importCertificate: '[data-testid="digital-certificate-create-form__certificate-type__radio__certificateType-radio-0"]',
    generateCSR: '[data-testid="digital-certificate-create-form__certificate-type__radio__certificateType-radio-1"]',
    trustedCA: '[data-testid="digital-certificate-create-form__certificate-type__radio__certificateType-radio-2"]'
  },

  // Toggle between Certificates and CRL view
  viewToggle: {
    certificates: '.p-selectbutton button:contains("Certificates")',
    crl: '.p-selectbutton button:contains("CRL")'
  },

  // Edit page
  edit: {
    pageTitle: '[data-testid="page_title_Edit Digital Certificate"]'
  },

  // Actions
  actions: {
    singleActionButton: '[data-testid="data-table-actions-column-body-action-button"]',
    menuButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]'
  },

  // Delete dialog
  deleteDialog: {
    confirmInput: '[data-testid="delete-dialog-confirmation-input-field"]',
    deleteButton: '[data-testid="delete-dialog-footer-delete-button"]',
    cancelButton: '[data-testid="delete-dialog-footer-cancel-button"]'
  },

  // Form actions
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]'
  },

  // Breadcrumb
  breadcrumb: {
    returnToList: '[data-testid="page-heading-block__breadcrumb__Digital Certificates"]'
  }
}
