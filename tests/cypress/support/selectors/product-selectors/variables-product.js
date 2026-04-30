export default {
  // Create button in list view
  createButton: '[data-testid="create_Variable_button"] > button:last-of-type',

  // Form fields
  keyField: '[data-testid="variables-form__key-field"]',
  keyInput: '[data-testid="variables-form__key-field__input"]',
  keyError: '[data-testid="variables-form__key-field__error-message"]',
  valueField: '[data-testid="variables-form__value-field"]',
  valueInput: '[data-testid="variables-form__value-field__input"]',
  valueError: '[data-testid="variables-form__value-field__error-message"]',
  secretField: '[data-testid="variables-form__secret-field"]',

  // List columns
  columns: {
    key: 'key',
    value: 'value',
    lastEditor: 'lastEditor',
    lastModified: 'lastModified'
  }
}
