export default {
  createButton: '[data-testid="create_Variable_button"]',
  keyInput: '[data-testid="variables-form__key-field__input"]',
  valueInput: '[data-testid="variables-form__value-field__input"]',
  secretToggle: '[data-testid="variables-form__secret-field__switch"] > .p-inputswitch-slider',
  listRow: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`,
  showMore: '[data-testid="table-column-expand-text-column__show-more__toggle"]'
}
