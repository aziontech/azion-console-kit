/**
 * Users - Read/List Tests (Self-Contained)
 *
 * API: GET v4/iam/users
 * Route: /users, /users/edit/:id
 *
 * Self-contained: Creates test data in before(), tests against it.
 * No cleanup needed - CI handles it or data can be reused.
 *
 * Supports fixture recording:
 * - CYPRESS_TEST_MODE=record: Records API responses to fixtures
 * - CYPRESS_TEST_MODE=replay: Uses recorded fixtures
 * - CYPRESS_TEST_MODE=live: Uses real API (default)
 */

import { tableHelpers, fixtureRecorder } from '../../../support/console-kit-helpers'

const selectors = {
  createButton: '[data-testid="create_User_button"]',
  searchInput: '[data-testid="data-table-search-input"]',
  form: {
    firstNameInput: '[data-testid="users-form__first-name-field"] input',
    lastNameInput: '[data-testid="users-form__last-name-field"] input',
    emailInput: '[data-testid="users-form__email-field"] input',
    teamsMultiselect: '[data-testid="users-form__teams-field__multiselect"]'
  },
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]'
  }
}

// Test data - created once, used by all tests in this spec
const timestamp = Date.now()
const testFirstName = `CyRead`
const testLastName = `List${timestamp}`
const testEmail = `cy-read-list-${timestamp}@test-azion.com`

// Helper to create a user for testing
const createTestUser = (firstName, lastName, email) => {
  // Navigate to Users list first
  cy.openProduct('Users Management')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  // Click create button
  cy.get(selectors.createButton).click()

  // Fill first name
  cy.get(selectors.form.firstNameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(firstName)

  // Fill last name
  cy.get(selectors.form.lastNameInput)
    .should('be.visible')
    .clear()
    .type(lastName)

  // Fill email
  cy.get(selectors.form.emailInput)
    .should('be.visible')
    .clear()
    .type(email)

  // Select a team (required field)
  cy.get(selectors.form.teamsMultiselect, { timeout: 10000 }).click()
  cy.get('[role="listbox"] [role="option"]', { timeout: 5000 }).first().click()
  // Close the multiselect
  cy.get('body').click(0, 0)

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Users - Read/List', { tags: ['@crud', '@users', '@v4'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestUser(testFirstName, testLastName, testEmail)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('users', 'v4/iam/users')
    cy.login()
    cy.openProduct('Users Management')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display users page', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains(/Name|First Name|Email/i).should('exist')
    })

    it('should display user data in rows', () => {
      cy.get('[data-testid*="list-table-block__column"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_USER_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter users by search term', () => {
      // Search for our test user by email
      tableHelpers.searchAndSubmit(testEmail)
      cy.get('[data-testid*="list-table-block__column"]', { timeout: 10000 })
        .should('contain', testFirstName)
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a row', () => {
      // Search for our test user first
      tableHelpers.searchAndSubmit(testEmail)
      cy.get('[data-testid*="list-table-block__column"]')
        .first()
        .click()

      cy.url({ timeout: 15000 }).should('include', '/users/edit/')
    })

    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })
  })
})
