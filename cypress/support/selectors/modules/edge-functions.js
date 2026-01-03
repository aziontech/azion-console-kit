/**
 * Edge Functions Module Selectors
 *
 * Based on cypress/specs/_catalogs/edge-functions.md
 *
 * Routes:
 * - /functions (list)
 * - /functions/create
 * - /functions/edit/:id
 *
 * API: v4/workspace/functions
 */

export default {
  // Page headings
  pageHeading: {
    list: '[data-testid="edge-functions__list-view__page-heading"]',
    create: '[data-testid="edge-functions__create-view__page-heading"]',
    edit: '[data-testid="edge-functions__edit-view__page-heading"]'
  },

  // Create button (on list page)
  createButton: '[data-testid="create_Function_button"]',

  // Form fields - Main Settings
  form: {
    // Name field
    name: {
      container: '[data-testid="edge-functions-form__name-field"]',
      input: '[data-testid="field-text__input"]',
      label: '[data-testid="edge-functions-form__name-field__label"]',
      error: '[data-testid="edge-functions-form__name-field__error"]'
    },

    // Runtime field (usually locked/display only)
    runtime: {
      container: '[data-testid="edge-functions-form__runtime-field"]',
      display: '[data-testid="edge-functions-form__runtime-field__display"]'
    },

    // Execution Environment (Application or Firewall)
    executionEnvironment: {
      container: '[data-testid="edge-functions-form__execution-env-field"]',
      application: '[data-testid="edge-functions-form__execution-env__application"]',
      firewall: '[data-testid="edge-functions-form__execution-env__firewall"]',
      // Radio button pattern
      radioGroup: '.p-radiobutton-box'
    },

    // Active/Status toggle
    active: {
      container: '[data-testid="edge-functions-form__active-field"]',
      switch: '[data-testid="edge-functions-form__active-field__switch"]',
      slider: '[data-testid="edge-functions-form__active-field__switch"] > .p-inputswitch-slider'
    },

    // Code editor (Monaco)
    code: {
      container: '[data-testid="edge-functions-form__code-field"]',
      editor: '.monaco-editor',
      editorTextArea: '.monaco-editor textarea',
      preview: '[data-testid="edge-functions-form__code-preview"]'
    },

    // Arguments (JSON or Form Builder)
    args: {
      container: '[data-testid="edge-functions-form__args-field"]',
      jsonEditor: '[data-testid="edge-functions-form__args-field__json-editor"]',
      formBuilder: '[data-testid="edge-functions-form__args-field__form-builder"]',
      modeToggle: '[data-testid="edge-functions-form__args-field__mode-toggle"]'
    }
  },

  // Tabs (for edit view)
  tabs: {
    container: '.p-tabview',
    mainSettings: '[data-testid="edge-functions-form__tab__main-settings"]',
    code: '[data-testid="edge-functions-form__tab__code"]',
    args: '[data-testid="edge-functions-form__tab__arguments"]',
    // Tab header pattern
    tabHeader: (index) => `.p-tabview-nav li:nth-child(${index + 1})`
  },

  // List table columns
  list: {
    column: {
      name: '[data-testid="list-table-block__column__name__row"]',
      id: '[data-testid="list-table-block__column__id__row"]',
      version: '[data-testid="list-table-block__column__version__row"]',
      vendor: '[data-testid="list-table-block__column__vendor__row"]',
      language: '[data-testid="list-table-block__column__language__row"]',
      runtime: '[data-testid="list-table-block__column__runtime__row"]',
      initiatorType: '[data-testid="list-table-block__column__initiatorType__row"]',
      executionEnvironment: '[data-testid="list-table-block__column__execution_environment__row"]',
      lastEditor: '[data-testid="list-table-block__column__lastEditor__row"]',
      lastModified: '[data-testid="list-table-block__column__lastModified__row"]',
      status: '[data-testid="list-table-block__column__active__row"]'
    },
    getColumn: (columnName) => `[data-testid="list-table-block__column__${columnName}__row"]`
  },

  // Empty state
  empty: {
    container: '[data-testid="edge-functions__list-view__empty-results-block"]',
    message: '[data-testid="list-table-block__empty-message__text"]',
    createButton: '[data-testid="list-table-block__empty-results-block__create-button"]'
  },

  // Drawer (for quick create from other modules)
  drawer: {
    container: '[data-testid="edge-functions__drawer"]',
    header: '[data-testid="edge-functions__drawer__header"]',
    closeButton: '[data-testid="edge-functions__drawer__close-button"]'
  },

  // Toast messages (for verification)
  toast: {
    created: 'Your Function has been created',
    updated: 'Your Function has been updated',
    deleted: 'Function successfully deleted'
  },

  // Validation patterns
  validation: {
    nameRequired: 'Name is required',
    codeRequired: 'Code is required',
    invalidJson: 'Invalid JSON'
  },

  // Execution environment options
  executionEnvironments: {
    application: 'edge_application',
    firewall: 'edge_firewall'
  }
}
