export default {
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
}
