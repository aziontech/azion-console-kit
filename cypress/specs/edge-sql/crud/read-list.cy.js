/**
 * Edge SQL - Read/List Tests (Self-Contained)
 *
 * API: v4/workspace/sql/databases
 * Route: /sql-database
 *
 * Self-contained: Creates test data in before(), tests against it.
 * No cleanup needed - CI handles it or data can be reused.
 *
 * Note: Edge SQL databases have async creation (polling).
 * Status flow: creating → created/ready → active
 *
 * Supports fixture recording:
 * - CYPRESS_TEST_MODE=record: Records API responses to fixtures
 * - CYPRESS_TEST_MODE=replay: Uses recorded fixtures
 * - CYPRESS_TEST_MODE=live: Uses real API (default)
 */

import { tableHelpers, fixtureRecorder } from '../../../support/console-kit-helpers'

const selectors = {
  contentBlock: '[data-testid="edge-sql-content-block"]',
  heading: '[data-testid="edge-sql-heading"]',
  listTableBlock: '[data-testid="edge-sql-list-table-block"]',
  emptyResultsBlock: '[data-testid="edge-sql-empty-results-block"]',
  createButton: '[data-testid="create_Database_button"]',
  table: '.p-datatable',
  nameColumn: '[data-testid*="list-table-block__column__name"]',
  statusColumn: '[data-testid*="list-table-block__column__status"]',
  searchInput: '[data-testid="data-table-search-input"]',
  actionsButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
  inlineMessage: '.p-inline-message',
  form: {
    nameInput: '[data-testid="edge-sql-form__name__input"]'
  },
  formActions: {
    saveButton: '[data-testid="form-actions-submit-button"]'
  }
}

// Test data - created once, used by all tests in this spec
const testDatabaseName = `cy-read-list-${Date.now()}`

// Wait for Edge SQL page to be ready
const waitForPageReady = () => {
  cy.get(selectors.contentBlock, { timeout: 15000 }).should('be.visible')
  tableHelpers.waitForListReady()
}

// Helper to create a database for testing
const createTestDatabase = (name) => {
  cy.visit('/sql-database')
  waitForPageReady()

  // Click create button
  cy.get(selectors.createButton).click()

  // Fill name
  cy.get(selectors.form.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

  // Wait for database to be created (polling)
  cy.visit('/sql-database')
  waitForPageReady()
}

describe('Edge SQL - Read/List', { tags: ['@crud', '@edge-sql'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestDatabase(testDatabaseName)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('edgeSql', 'v4/workspace/sql/databases')
    cy.login()
    cy.visit('/sql-database')
    waitForPageReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('Page Display', () => {
    it('should display edge sql page', () => {
      cy.url().should('include', '/sql-database')
      cy.get(selectors.contentBlock).should('be.visible')
    })

    it('should display page title', () => {
      cy.contains('SQL Database').should('be.visible')
    })

    it('should display create button', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })
  })

  describe('Table Display', () => {
    it('should display table with columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains('Status').should('exist')
    })

    it('should display databases in list', () => {
      cy.get(selectors.nameColumn).should('have.length.at.least', 1)
    })

    it('should display our test database', () => {
      tableHelpers.searchAndSubmit(testDatabaseName)
      cy.get(selectors.nameColumn, { timeout: 10000 })
        .should('contain', testDatabaseName)
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput).should('be.visible')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_DATABASE_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter databases by search term', () => {
      tableHelpers.searchAndSubmit(testDatabaseName)
      cy.get(selectors.nameColumn, { timeout: 10000 })
        .should('contain', testDatabaseName)
    })
  })

  describe('Row Actions', () => {
    it('should display actions menu button', () => {
      cy.get(selectors.actionsButton).should('exist')
    })

    it('should display delete action in menu', () => {
      tableHelpers.searchAndSubmit(testDatabaseName)
      cy.get(selectors.actionsButton).first().click()
      cy.get('[role="menuitem"]').contains(/delete/i).should('exist')
      cy.get('body').click(0, 0)
    })
  })

  describe('Navigation', () => {
    it('should navigate to create page', () => {
      cy.get(selectors.createButton).click()
      cy.url().should('include', '/sql-database/create')
    })

    it('should navigate to database view when clicking row', () => {
      tableHelpers.searchAndSubmit(testDatabaseName)
      cy.get(selectors.nameColumn).first().click()
      cy.url().should('include', '/sql-database/database/')
    })
  })
})
