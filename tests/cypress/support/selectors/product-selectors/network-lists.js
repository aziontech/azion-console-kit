export default {
  createButton: '[data-testid="create_Network List_button"] > .p-button-label',
  nameInput: '[data-testid="network-list-form__name__input"]',
  typeDropdown: '[data-testid="network-list-form__type__dropdown"]',
  asnTextarea: '[data-testid="network-list-form__asn-list__textarea"]',
  ipcidrTextarea: '[data-testid="network-list-form__ipcidr-list__textarea"]',
  countriesMultiselect: '[data-testid="network-list-form__countries__multiselect"]',
  saveButton: '[data-testid="form-actions-submit-button"]',
  cancelButton: '[data-testid="form-actions-cancel-button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  nameRow: '[data-testid="list-table-block__column__name__row"]',
  countriesListOption: (recordType) => `#countriesList_${recordType}`,
  typeRow: '[data-testid="list-table-block__column__listType__row"]'
}
