/**
 * Edge DNS Module Selectors
 *
 * API: v4/workspace/dns/zones
 * Route: /edge-dns
 */

export default {
  // List page
  createButton: '[data-testid="create_Zone_button"]',
  table: '.p-datatable',
  emptyState: '[data-testid*="empty"]',
  searchInput: '[data-testid="data-table-search-input"]',
  nameColumn: '[data-testid*="list-table-block__column__name"]',

  // Zone form
  form: {
    nameInput: '[data-testid="edge-dns-form__name__input"]',
    domainInput: '[data-testid="edge-dns-form__domain__input"]',
    statusSwitch: '[data-testid="edge-dns-form__status"]'
  },

  // Form actions
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]'
  },

  // Edit view tabs
  tabs: {
    mainSettings: '[data-testid="edge-dns-edit-view__main-settings__tab-panel"]',
    records: '[data-testid="edge-dns-edit-view__records__tab-panel"]'
  },

  // Records form
  records: {
    tab: '[data-testid="edge-dns-edit-view__records__tab-panel"] > a',
    createButton: '[data-testid="create_Record_button"]',
    nameInput: '[data-testid="edge-dns-records-form__settings__name-field__input"]',
    recordTypeDropdown: '[data-testid="edge-dns-records-form__settings__record-type-field__dropdown"]',
    recordTypeOption: (recordType) => `#selectedRecordType_${recordType}`,
    ttlInput: '[data-testid="edge-dns-records-form__settings__ttl-field__input"]',
    valueTextarea: '[data-testid="edge-dns-records-form__settings__value-field__textarea"]',
    policyTypeDropdown: '[data-testid="edge-dns-records-form__policy__policy-type-field__dropdown"]',
    policyTypeOption: (policyType) => `#selectedPolicy_${policyType}`,
    weightInput: '[data-testid="edge-dns-records-form__policy__weight-field__input"]',
    descriptionTextarea: '[data-testid="edge-dns-records-form__policy__description-field__textarea"]'
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

  // List columns
  list: {
    columnName: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`
  }
}
