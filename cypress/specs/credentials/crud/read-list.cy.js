/**
 * Credentials - Read/List Tests (Self-Contained)
 *
 * API: v4/workspace/storage/credentials
 * Route: /credentials
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
  contentBlock: '[data-testid="credentials-content-block"]',
  heading: '[data-testid="credentials-heading"]',
  objectStorageTab: '[data-testid="credentials-tab-panel__Object Storage__tab"]',
  createButton: '[data-testid="create_Credential_button"]',
  table: '.p-datatable',
  nameColumn: '[data-testid*="list-table-block__column__name"]',
  accessKeyColumn: '[data-testid*="list-table-block__column__accessKey"]',
  bucketColumn: '[data-testid*="list-table-block__column__bucket"]',
  searchInput: '[data-testid="data-table-search-input"]',
  actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
  form: {
    nameInput: '[data-testid="credentials-form__name__input"]',
    descriptionInput: '[data-testid="credentials-form__description__input"]'
  },
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]'
  }
}

// Test data - created once, used by all tests in this spec
const testCredentialName = `cy-read-list-${Date.now()}`

// Wait for Credentials page to be ready
const waitForPageReady = () => {
  cy.get(selectors.contentBlock, { timeout: 15000 }).should('be.visible')
  cy.get(selectors.objectStorageTab, { timeout: 10000 }).should('be.visible')
  tableHelpers.waitForListReady()
}

// Helper to create a credential for testing
const createTestCredential = (name) => {
  cy.visit('/credentials')
  waitForPageReady()

  // Click create button
  cy.get(selectors.createButton).click()

  // Fill name
  cy.get(selectors.form.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Description is optional but helps identify test data
  cy.get('body').then(($body) => {
    if ($body.find(selectors.form.descriptionInput).length) {
      cy.get(selectors.form.descriptionInput).type('Cypress test credential')
    }
  })

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Credentials - Read/List', { tags: ['@crud', '@credentials', '@account-menu'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestCredential(testCredentialName)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('credentials', 'v4/workspace/storage/credentials')
    cy.login()
    cy.visit('/credentials')
    waitForPageReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('Page Display', () => {
    it('should display credentials page', () => {
      cy.url().should('include', '/credentials')
      cy.get(selectors.contentBlock).should('be.visible')
    })

    it('should display page title', () => {
      cy.contains('Credentials').should('be.visible')
    })

    it('should display Object Storage tab', () => {
      cy.get(selectors.objectStorageTab).should('be.visible')
      cy.contains('Object Storage').should('be.visible')
    })

    it('should display create button', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })
  })

  describe('Table Display', () => {
    it('should display table with columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains('Access Key').should('exist')
      cy.get('th').contains('Capabilities').should('exist')
      cy.get('th').contains('Bucket').should('exist')
    })

    it('should display credentials in list', () => {
      cy.get(selectors.nameColumn).should('have.length.at.least', 1)
    })

    it('should display our test credential', () => {
      tableHelpers.searchAndSubmit(testCredentialName)
      cy.get(selectors.nameColumn, { timeout: 10000 })
        .should('contain', testCredentialName)
    })
  })

  describe('Search Functionality', () => {
    it('should search for credentials', () => {
      cy.get(selectors.searchInput).should('be.visible')
      tableHelpers.searchAndSubmit(testCredentialName)
      cy.get(selectors.nameColumn, { timeout: 10000 })
        .should('contain', testCredentialName)
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_CREDENTIAL_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })
  })

  describe('Row Actions', () => {
    it('should display actions menu button', () => {
      tableHelpers.searchAndSubmit(testCredentialName)
      cy.get(selectors.actionsButton).should('exist')
    })

    it('should display delete action in menu', () => {
      tableHelpers.searchAndSubmit(testCredentialName)
      cy.get(selectors.actionsButton).first().click()
      cy.get('[role="menuitem"]').contains(/delete/i).should('exist')
      cy.get('body').click(0, 0)
    })
  })
})
