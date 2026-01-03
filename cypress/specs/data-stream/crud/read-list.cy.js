/**
 * Data Stream - Read/List Tests (Self-Contained)
 *
 * API: GET v4/workspace/stream/streams
 * Route: /data-stream, /data-stream/edit/:id
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
import selectors from '../../../support/selectors/product-selectors/data-stream'

// Test data - created once, used by all tests in this spec
const testStreamName = `cy-read-list-${Date.now()}`

// Helper to create a data stream for testing
const createTestDataStream = (name) => {
  // Navigate to Data Stream list first
  cy.openProduct('Data Stream')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  // Click create button
  cy.get(selectors.createButton).click()

  // Fill name
  cy.get(selectors.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Select connector - HTTP/HTTPS POST (first option usually)
  cy.get(selectors.connectorDropdown, { timeout: 10000 }).click()
  cy.get('[role="listbox"] [role="option"]', { timeout: 5000 }).first().click()

  // Fill HTTP URL (required for HTTP connector)
  cy.get('[data-testid*="url-field__input"]', { timeout: 10000 })
    .should('be.visible')
    .type('https://httpbin.org/post')

  // Submit
  cy.get(selectors.formActions.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Data Stream - Read/List', { tags: ['@crud', '@data-stream', '@v4'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestDataStream(testStreamName)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('dataStream', 'v4/workspace/stream/streams')
    cy.login()
    cy.openProduct('Data Stream')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display data stream page', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains(/Source|Template|Connector|Status/i).should('exist')
    })

    it('should display stream data in rows', () => {
      cy.get('[data-testid*="list-table-block__column__name"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_STREAM_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter streams by search term', () => {
      // Search for our test stream
      tableHelpers.searchAndSubmit(testStreamName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 10000 })
        .should('contain', testStreamName)
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a row', () => {
      // Search for our test stream first
      tableHelpers.searchAndSubmit(testStreamName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testStreamName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/data-stream/edit/')
      cy.get(selectors.nameInput, { timeout: 15000 }).should('exist')
    })

    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })
  })

  describe('Detail View (Edit Page)', () => {
    it('should load stream data for editing', () => {
      // Navigate to our test stream
      tableHelpers.searchAndSubmit(testStreamName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testStreamName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('have.value', testStreamName)
    })

    it('should display all form sections in edit view', () => {
      // Navigate to our test stream
      tableHelpers.searchAndSubmit(testStreamName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testStreamName)
        .click()

      // Verify form sections
      cy.get(selectors.nameInput, { timeout: 15000 }).should('exist')
      cy.get(selectors.connectorDropdown, { timeout: 10000 }).should('exist')
    })
  })
})
