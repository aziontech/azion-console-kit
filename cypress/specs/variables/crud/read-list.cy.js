/**
 * Variables - Read/List Tests (Self-Contained)
 *
 * API: GET v3/variables
 * Route: /variables, /variables/edit/:id
 *
 * Self-contained: Creates test data in before(), tests against it.
 * No cleanup needed - CI handles it or data can be reused.
 *
 * Note: Variables uses v3 API (legacy).
 * Note: Secret variables cannot be edited (value shows as *******).
 *
 * Supports fixture recording:
 * - CYPRESS_TEST_MODE=record: Records API responses to fixtures
 * - CYPRESS_TEST_MODE=replay: Uses recorded fixtures
 * - CYPRESS_TEST_MODE=live: Uses real API (default)
 */

import { tableHelpers, fixtureRecorder } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_Variable_button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  form: {
    keyInput: '[data-testid="variables-form__key-field__input"]',
    valueInput: '[data-testid="variables-form__value-field__input"]',
    secretField: '[data-testid="variables-form__secret-field"]'
  },
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]'
  }
}

// Test data - created once, used by all tests in this spec
const testVariableKey = `CY_READ_LIST_${Date.now()}`
const testVariableValue = 'test-value-for-read-list'

// Helper to create a variable for testing
const createTestVariable = (key, value) => {
  // Navigate to Variables list first
  cy.openProduct('Variables')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  // Click create button
  cy.get(selectors.createButton).click()

  // Fill key
  cy.get(selectors.form.keyInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(key)

  // Fill value
  cy.get(selectors.form.valueInput, { timeout: 10000 })
    .should('be.visible')
    .clear()
    .type(value)

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Variables - Read/List', { tags: ['@crud', '@variables', '@v3', '@smoke'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestVariable(testVariableKey, testVariableValue)
  })

  beforeEach(() => {
    // Setup fixture recording/replay for v3/variables API
    fixtureRecorder.setupSync('variables', 'v3/variables')

    cy.login()
    cy.openProduct('Variables')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    // Save recorded fixtures (only runs in record mode)
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display variables page', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains('Key').should('exist')
      cy.get('th').contains('Value').should('exist')
    })

    it('should display variable data in rows', () => {
      cy.get('[data-testid*="list-table-block__column__key"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_VAR_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter variables by search term', () => {
      // Search for our test variable
      tableHelpers.searchAndSubmit(testVariableKey)
      cy.get('[data-testid*="list-table-block__column__key"]', { timeout: 10000 })
        .should('contain', testVariableKey)
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a row', () => {
      // Search for our test variable first
      tableHelpers.searchAndSubmit(testVariableKey)
      cy.get('[data-testid*="list-table-block__column__key"]')
        .contains(testVariableKey)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/variables/edit/')
      cy.get(selectors.form.keyInput, { timeout: 15000 }).should('exist')
    })

    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })
  })

  describe('Detail View (Edit Page)', () => {
    it('should load variable data for editing', () => {
      // Navigate to our test variable
      tableHelpers.searchAndSubmit(testVariableKey)
      cy.get('[data-testid*="list-table-block__column__key"]')
        .contains(testVariableKey)
        .click()

      cy.get(selectors.form.keyInput, { timeout: 15000 })
        .should('have.value', testVariableKey)
    })

    it('should display secret toggle in edit form', () => {
      // Navigate to our test variable
      tableHelpers.searchAndSubmit(testVariableKey)
      cy.get('[data-testid*="list-table-block__column__key"]')
        .contains(testVariableKey)
        .click()

      cy.get(selectors.form.secretField, { timeout: 15000 }).should('exist')
    })
  })
})
