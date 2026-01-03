/**
 * Variables Module Selectors
 *
 * Based on cypress/specs/_catalogs/variables.md
 *
 * Routes:
 * - /variables (list)
 * - /variables/create
 * - /variables/edit/:id
 *
 * API: v3/variables
 */

export default {
  // Page headings
  pageHeading: {
    list: '[data-testid="variables__list-view__page-heading"]',
    create: '[data-testid="variables__create-view__page-heading"]',
    edit: '[data-testid="variables__edit-view__page-heading"]'
  },

  // Create button (on list page)
  createButton: '[data-testid="create_Variable_button"]',

  // Form fields
  form: {
    // Key field - accepts only UPPERCASE, numbers, underscore
    key: {
      container: '[data-testid="variables-form__key-field"]',
      input: '[data-testid="variables-form__key-field__input"]',
      label: '[data-testid="variables-form__key-field__label"]',
      error: '[data-testid="variables-form__key-field__error"]'
    },

    // Value field
    value: {
      container: '[data-testid="variables-form__value-field"]',
      input: '[data-testid="variables-form__value-field__input"]',
      label: '[data-testid="variables-form__value-field__label"]',
      error: '[data-testid="variables-form__value-field__error"]'
    },

    // Secret toggle
    secret: {
      container: '[data-testid="variables-form__secret-field"]',
      switch: '[data-testid="variables-form__secret-field__switch"]',
      slider: '[data-testid="variables-form__secret-field__switch"] > .p-inputswitch-slider',
      label: '[data-testid="variables-form__secret-field__label"]'
    }
  },

  // List table columns
  list: {
    // Row columns
    column: {
      key: '[data-testid="list-table-block__column__key__row"]',
      value: '[data-testid="list-table-block__column__value__row"]',
      lastEditor: '[data-testid="list-table-block__column__lastEditor__row"]',
      lastModified: '[data-testid="list-table-block__column__lastModified__row"]'
    },

    // Get column by name
    getColumn: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`,

    // Secret mask indicator
    secretMask: '.p-password-mask, [class*="secret"]',

    // Show more toggle for long values
    showMore: '[data-testid="table-column-expand-text-column__show-more__toggle"]'
  },

  // Empty state
  empty: {
    container: '[data-testid="variables__list-view__empty-results-block"]',
    message: '[data-testid="list-table-block__empty-message__text"]',
    createButton: '[data-testid="list-table-block__empty-results-block__create-button"]'
  },

  // Toast messages (for verification)
  toast: {
    created: 'Your variable has been created',
    updated: 'Your variable has been updated',
    deleted: 'Variable successfully deleted'
  },

  // Validation patterns
  validation: {
    keyPattern: /^[A-Z0-9_]*$/,
    keyErrorMessage: 'Invalid key format'
  }
}
